#!/usr/bin/env node
/**
 * MEGA-CRAWL v3: Full Catalog Pull from Ingram Micro + SYNNEX Cross-Reference
 *
 * API behavior (tested):
 * - Ingram returns 25 products/page (pageSize capped), uses nextPage field
 * - No-filter pagination: ~5,000 products (200 pages)
 * - Keyword searches: up to 10,000 per keyword, dedup by ingramPartNumber
 * - D&H API returns 404 for all endpoints — skipped
 * - SYNNEX uses numeric mfgCodes, not 3-letter abbreviations
 *
 * Phases:
 *   1a: Paginate entire Ingram catalog (no filter)
 *   1b: Keyword searches for each brand + product category
 *   2: SYNNEX cross-reference using discovered MPNs
 *
 * Usage: node scripts/mega-crawl.mjs
 */

import fs from "fs";
import crypto from "crypto";

// =============================================================================
// ENV SETUP
// =============================================================================

const envVars = JSON.parse(fs.readFileSync("/tmp/var-ecommerce-env.json", "utf8"));
Object.assign(process.env, envVars);

// =============================================================================
// RATE LIMITER (token bucket)
// =============================================================================

class RateLimiter {
  constructor() { this.buckets = new Map(); }
  define(name, maxReq, windowMs) {
    this.buckets.set(name, { tokens: maxReq, max: maxReq, rate: maxReq / windowMs, last: Date.now() });
  }
  async acquire(name) {
    const b = this.buckets.get(name);
    while (true) {
      const now = Date.now();
      b.tokens = Math.min(b.max, b.tokens + (now - b.last) * b.rate);
      b.last = now;
      if (b.tokens >= 1) { b.tokens--; return; }
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

const limiter = new RateLimiter();
limiter.define("ingram", 50, 60_000); // slightly under 55/min for safety
limiter.define("synnex", 20, 60_000); // slightly under 25/min for safety

// =============================================================================
// INGRAM MICRO CLIENT — with 429 retry + exponential backoff
// =============================================================================

let iToken = null, iTokenExp = 0;

async function ingramAuth(force = false) {
  if (!force && iToken && Date.now() < iTokenExp) return iToken;
  const res = await fetch("https://api.ingrammicro.com:443/oauth/oauth20/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.INGRAM_CLIENT_ID,
      client_secret: process.env.INGRAM_CLIENT_SECRET,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Ingram auth: ${res.status}`);
  const j = await res.json();
  iToken = j.access_token;
  iTokenExp = Date.now() + (j.expires_in - 60) * 1000;
  return iToken;
}

async function ingramSearch(params, attempt = 0) {
  await limiter.acquire("ingram");
  const token = await ingramAuth();

  const qs = new URLSearchParams();
  if (params.keyword) qs.set("keyword", params.keyword);
  qs.set("pageNumber", String(params.pageNumber || 1));
  qs.set("pageSize", "50");

  const res = await fetch(`https://api.ingrammicro.com/resellers/v6/catalog?${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "IM-CustomerNumber": process.env.INGRAM_CUSTOMER_NUMBER || "70-086662",
      "IM-CountryCode": "US",
      "IM-CorrelationID": crypto.randomUUID().replace(/-/g, ""),
      "IM-SenderID": "A5IT-SonicWall-Store",
      Accept: "application/json",
    },
  });

  if (res.status === 401 && attempt === 0) {
    iToken = null; iTokenExp = 0;
    return ingramSearch(params, 1);
  }

  if (res.status === 429 && attempt < 5) {
    const wait = Math.pow(2, attempt + 1) * 1000 + Math.random() * 2000;
    process.stdout.write(`[429 backoff ${(wait/1000).toFixed(0)}s]`);
    await new Promise(r => setTimeout(r, wait));
    return ingramSearch(params, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ingram ${res.status}: ${text.slice(0, 150)}`);
  }

  const json = await res.json();
  return {
    products: Array.isArray(json.catalog) ? json.catalog : [],
    hasMore: !!json.nextPage,
    recordsFound: json.recordsFound || 0,
  };
}

// =============================================================================
// TD SYNNEX CLIENT
// =============================================================================

function escXml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function parseSynnex(xml) {
  const items = [];
  const re = /<PriceAvailabilityList>([\s\S]*?)<\/PriceAvailabilityList>/g;
  let m;
  while ((m = re.exec(xml))) {
    const b = m[1];
    const g = t => { const x = b.match(new RegExp(`<${t}>([^<]*)</${t}>`)); return x ? x[1].trim() : ""; };
    const whs = [];
    const wr = /<warehouseInfo>([\s\S]*?)<\/warehouseInfo>/g;
    let wm;
    while ((wm = wr.exec(b))) {
      const wb = wm[1];
      const wg = t => { const x = wb.match(new RegExp(`<${t}>([^<]*)</${t}>`)); return x ? x[1].trim() : ""; };
      whs.push({ id: wg("number"), name: wg("name"), quantity: parseInt(wg("qty")||"0") });
    }
    items.push({ mfgPN: g("mfgPN"), mfgCode: g("mfgCode"), synnexSKU: g("synnexSKU"),
      description: g("description"), unitPrice: g("unitPrice"),
      totalQuantity: parseInt(g("totalQuantity")||"0"), warehouses: whs });
  }
  return items;
}

async function synnexPna(mpns, attempt = 0) {
  if (!mpns.length) return [];
  await limiter.acquire("synnex");

  const skus = mpns.map(m => `<skuList><mfgPN>${escXml(m)}</mfgPN></skuList>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<priceRequest>\n<customerNo>${process.env.SYNNEX_CUSTOMER_NO}</customerNo>\n<userName>${escXml(process.env.SYNNEX_USERNAME)}</userName>\n<password>${escXml(process.env.SYNNEX_PASSWORD)}</password>\n${skus}\n</priceRequest>`;

  const res = await fetch("https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability", {
    method: "POST", headers: { "Content-Type": "application/xml" }, body,
  });

  if (res.status === 429 && attempt < 3) {
    await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
    return synnexPna(mpns, attempt + 1);
  }

  if (!res.ok) throw new Error(`SYNNEX ${res.status}`);
  return parseSynnex(await res.text());
}

// =============================================================================
// CRAWL INFRASTRUCTURE
// =============================================================================

const seenSkus = new Set();
const brands = new Map();
const allMpns = new Set();
let totalProducts = 0, totalPages = 0;

async function crawlKeyword(kw, stream, maxPages = 200) {
  let page = 1, hasMore = true, added = 0, records = 0;

  while (hasMore && page <= maxPages) {
    try {
      const r = await ingramSearch({ keyword: kw || undefined, pageNumber: page });
      records = r.recordsFound;
      totalPages++;

      for (const p of r.products) {
        const sku = p.ingramPartNumber;
        if (!sku || seenSkus.has(sku)) continue;
        seenSkus.add(sku);

        const mpn = p.vendorPartNumber || "";
        const vn = p.vendorName || "UNKNOWN";
        const ex = brands.get(vn);
        if (ex) ex.count++; else brands.set(vn, { count: 1, vendorNumber: p.vendorNumber||"", sampleMpn: mpn, sampleDesc: (p.description||"").slice(0,80) });
        if (mpn) allMpns.add(mpn);

        stream.write(JSON.stringify(p) + "\n");
        totalProducts++;
        added++;
      }

      hasMore = r.hasMore;
      page++;
    } catch (err) {
      // Log error but continue to next page (or break if first page fails)
      if (page === 1) break;
      console.error(`    ${kw||"(all)"} p${page}: ${err.message.slice(0,80)}`);
      break;
    }
  }
  return { added, records, pages: page - 1 };
}

// =============================================================================
// MAIN
// =============================================================================

console.log("================================================================");
console.log("  MEGA-CRAWL v3: Ingram + SYNNEX");
console.log("================================================================\n");

const t0 = Date.now();
const iStream = fs.createWriteStream("/tmp/ingram-products.jsonl");

// --- Phase 1a: Full catalog ---
console.log("--- Phase 1a: Full Ingram Catalog (no filter) ---\n");
const p1a = await crawlKeyword(null, iStream, 200);
console.log(`  Full catalog: ${p1a.added} products, ${p1a.pages} pages\n`);

// Pause 15s to let rate limit tokens refill after 200-page crawl
await new Promise(r => setTimeout(r, 15000));

// --- Phase 1b: Keyword searches ---
console.log("--- Phase 1b: Keyword Searches ---\n");

const KEYWORDS = [
  "SonicWall", "Fortinet", "Cisco", "Palo Alto", "WatchGuard",
  "Aruba", "Juniper", "Sophos", "Meraki", "Barracuda",
  "Dell", "HP", "HPE", "Lenovo", "ASUS", "Samsung", "Microsoft",
  "APC", "Tripp Lite", "CyberPower", "Eaton", "Vertiv",
  "Synology", "QNAP", "Seagate", "Western Digital", "Kingston",
  "TP-Link", "Netgear", "D-Link", "Zyxel", "Ubiquiti",
  "Poly", "Yealink", "Jabra", "Logitech", "Crestron",
  "Veeam", "Acronis", "VMware", "Datto",
  "StarTech", "C2G", "Belkin",
  "Brother", "Epson", "Lexmark", "Xerox", "Canon",
  "LG", "ViewSonic", "BenQ", "Acer",
  "Check Point", "CrowdStrike", "Trend Micro", "ESET", "Bitdefender",
  "Ruckus", "EnGenius", "Cambium", "Extreme Networks", "MikroTik",
  "Intel", "AMD", "Supermicro", "Buffalo", "NetApp", "Crucial",
  "Schneider Electric", "Liebert", "Corsair",
  "Zebra", "Honeywell", "Panduit", "Ergotron", "Targus", "Kensington",
  "Neat", "Zoom", "Citrix", "Arcserve",
  // Product categories
  "firewall", "router", "access point", "server",
  "UPS", "rack", "monitor", "laptop", "desktop",
  "NAS", "SSD", "cable", "adapter",
  "printer", "scanner", "webcam", "headset",
  "software", "license", "warranty",
];

let lastPages = 0;
for (const kw of KEYWORDS) {
  // Adaptive pause: 2s base + 100ms per page the last crawl used (max 15s total)
  const pauseMs = 2000 + Math.min(lastPages * 100, 13000);
  await new Promise(r2 => setTimeout(r2, pauseMs));

  const r = await crawlKeyword(kw, iStream, 200);
  lastPages = r.pages;
  if (r.added > 0) {
    console.log(`  ${kw}: +${r.added} new (records: ${r.records}, ${r.pages} pages)`);
  }
}

iStream.end();
await new Promise(r => iStream.on("finish", r));

const t1 = ((Date.now() - t0) / 60000).toFixed(1);
console.log(`\n  Ingram TOTAL: ${totalProducts} unique, ${brands.size} brands, ${totalPages} API calls, ${t1} min\n`);

// --- Phase 2: SYNNEX cross-reference ---
console.log("--- Phase 2: SYNNEX Cross-Reference ---\n");

const mpns = [...allMpns];
const sxBrands = new Map();
let sxTotal = 0, sxBatches = 0;
const sStream = fs.createWriteStream("/tmp/synnex-products.jsonl");

for (let i = 0; i < mpns.length; i += 50) {
  const batch = mpns.slice(i, i + 50);
  try {
    const items = await synnexPna(batch);
    for (const item of items) {
      sStream.write(JSON.stringify(item) + "\n");
      sxTotal++;
      const mc = item.mfgCode || "UNKNOWN";
      const ex = sxBrands.get(mc);
      if (ex) ex.count++; else sxBrands.set(mc, { count: 1, sampleMpn: item.mfgPN });
    }
    sxBatches++;
    if (sxBatches % 20 === 0) {
      console.log(`  SYNNEX: ${sxBatches} batches (${((i+batch.length)/mpns.length*100).toFixed(0)}%), ${sxTotal} found`);
    }
  } catch (err) {
    console.error(`  SYNNEX batch ${sxBatches}: ${err.message.slice(0,80)}`);
  }
}

sStream.end();
await new Promise(r => sStream.on("finish", r));
console.log(`  SYNNEX DONE: ${sxTotal} products, ${sxBrands.size} mfgCodes\n`);

// Empty D&H file so import doesn't fail
fs.writeFileSync("/tmp/dh-products.jsonl", "");

// --- Output brands ---
const allBrandsOutput = {
  ingram: [...brands.entries()].map(([n,i]) => ({rawName:n, count:i.count, vendorNumber:i.vendorNumber, sampleMpn:i.sampleMpn, sampleDesc:i.sampleDesc})).sort((a,b)=>b.count-a.count),
  dh: [],
  synnex: [...sxBrands.entries()].map(([n,i]) => ({rawMfgCode:n, count:i.count, sampleMpn:i.sampleMpn})).sort((a,b)=>b.count-a.count),
};

console.log("--- Discovered Brands ---\n");
console.log(`Ingram (${allBrandsOutput.ingram.length}):`);
for (const b of allBrandsOutput.ingram.slice(0,30)) console.log(`  ${b.rawName} (${b.count}) | ${b.sampleDesc}`);
if (allBrandsOutput.ingram.length > 30) console.log(`  ...+${allBrandsOutput.ingram.length-30} more`);

console.log(`\nSYNNEX mfgCodes (${allBrandsOutput.synnex.length}):`);
for (const b of allBrandsOutput.synnex.slice(0,20)) console.log(`  ${b.rawMfgCode} (${b.count}) | mpn=${b.sampleMpn}`);
if (allBrandsOutput.synnex.length > 20) console.log(`  ...+${allBrandsOutput.synnex.length-20} more`);

fs.writeFileSync("/tmp/all-brands.json", JSON.stringify(allBrandsOutput, null, 2));

const tTotal = ((Date.now() - t0) / 60000).toFixed(1);
console.log("\n================================================================");
console.log("  MEGA-CRAWL COMPLETE");
console.log(`  Ingram:  ${totalProducts} products, ${brands.size} brands`);
console.log(`  SYNNEX:  ${sxTotal} products, ${sxBrands.size} mfgCodes`);
console.log(`  MPNs:    ${allMpns.size} unique`);
console.log(`  Time:    ${tTotal} min`);
console.log("================================================================\n");
