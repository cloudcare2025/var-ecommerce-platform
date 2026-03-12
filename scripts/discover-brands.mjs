/**
 * Brand Discovery Script
 *
 * Phase 1: Pull products from all 3 distributors
 * Phase 2: Collect all unique brand names
 * Phase 3: Output for AI-driven mapping
 */

import fs from "fs";
import crypto from "crypto";

// Load env vars from Railway export
const envVars = JSON.parse(fs.readFileSync("/tmp/var-ecommerce-env.json", "utf8"));
Object.assign(process.env, envVars);

// Use the public DB URL
process.env.DATABASE_URL = envVars.DATABASE_PUBLIC_URL || envVars.DATABASE_URL;

console.log("=== BRAND DISCOVERY ===\n");

// ---------------------------------------------------------------------------
// Ingram Micro client (inline)
// ---------------------------------------------------------------------------

let ingramToken = null;
let ingramTokenExpiry = 0;

async function getIngramToken() {
  if (ingramToken && Date.now() < ingramTokenExpiry) return ingramToken;

  const res = await fetch("https://api.ingrammicro.com:443/oauth/oauth20/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.INGRAM_CLIENT_ID,
      client_secret: process.env.INGRAM_CLIENT_SECRET,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Ingram auth failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  ingramToken = json.access_token;
  ingramTokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
  return ingramToken;
}

async function ingramSearch(params) {
  const token = await getIngramToken();
  const qs = new URLSearchParams();
  if (params.keyword) qs.set("keyword", params.keyword);
  if (params.vendorName) qs.set("vendorName", params.vendorName);
  if (params.category) qs.set("category", params.category);
  qs.set("pageNumber", String(params.pageNumber || 1));
  qs.set("pageSize", String(params.pageSize || 100));

  const url = `https://api.ingrammicro.com/resellers/v6/catalog?${qs.toString()}`;
  const corrId = crypto.randomUUID().replace(/-/g, "");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "IM-CustomerNumber": process.env.INGRAM_CUSTOMER_NUMBER || "70-086662",
      "IM-CountryCode": "US",
      "IM-CorrelationID": corrId,
      "IM-SenderID": "A5IT-SonicWall-Store",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ingram search failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const products = Array.isArray(json.catalog) ? json.catalog : Array.isArray(json) ? json : [];

  const totalRecords = parseInt(res.headers.get("im-total-records") || "0", 10);
  const currentPage = parseInt(res.headers.get("im-current-page") || String(params.pageNumber || 1), 10);
  const pageSize = parseInt(res.headers.get("im-page-size") || String(params.pageSize || 100), 10);
  const hasMore = totalRecords > 0 ? currentPage * pageSize < totalRecords : products.length >= (params.pageSize || 100);

  return { products, hasMore, nextPage: currentPage + 1, totalRecords };
}

// ---------------------------------------------------------------------------
// D&H client (inline)
// ---------------------------------------------------------------------------

let dhToken = null;
let dhTokenExpiry = 0;

async function getDhToken() {
  if (dhToken && Date.now() < dhTokenExpiry) return dhToken;

  const res = await fetch("https://auth.dandh.com/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.DH_CLIENT_ID,
      client_secret: process.env.DH_CLIENT_SECRET,
    }).toString(),
  });

  if (!res.ok) throw new Error(`D&H auth failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  dhToken = json.access_token;
  dhTokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
  return dhToken;
}

async function dhSearch(keyword) {
  const token = await getDhToken();
  const accountId = process.env.DH_ACCOUNT_ID || "3254650000";

  let allItems = [];
  let url = `https://api.dandh.com/customers/${accountId}/items?keyword=${encodeURIComponent(keyword)}&pageSize=100`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`  D&H search failed for "${keyword}": ${res.status} ${text.slice(0, 100)}`);
      break;
    }

    const json = await res.json();
    const items = Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : [];
    allItems.push(...items);

    url = json.scrollId
      ? `https://api.dandh.com/customers/${accountId}/items?scrollId=${encodeURIComponent(json.scrollId)}`
      : null;
  }

  return allItems;
}

// ---------------------------------------------------------------------------
// Phase 1: Discover Ingram brands via broad search
// ---------------------------------------------------------------------------

const allBrands = new Map(); // brandName -> { count, sampleMpn, sampleDesc, distributor, vendorNumber }

console.log("--- PHASE 1: Ingram Micro Catalog Crawl ---\n");

// Search with broad keywords to discover the full catalog
const searchTerms = [
  // Networking / Security brands
  "SonicWall", "Fortinet", "Cisco", "Palo Alto", "WatchGuard", "Aruba",
  "Juniper", "Ruckus", "Sophos", "Ubiquiti", "Meraki", "Barracuda",
  // Broader IT
  "Dell", "HP", "HPE", "Lenovo", "ASUS", "Samsung", "Microsoft", "APC",
  "Tripp Lite", "CyberPower", "Eaton", "Schneider", "Vertiv",
  "Datto", "Veeam", "Acronis", "VMware", "Citrix",
  // More networking
  "TP-Link", "Netgear", "D-Link", "MikroTik", "Zyxel",
  "EnGenius", "Cambium", "Extreme Networks",
  // Infrastructure
  "Intel", "AMD", "Seagate", "Western Digital", "Kingston", "Crucial",
  "Synology", "QNAP", "Buffalo",
  // AV / Collaboration
  "Poly", "Yealink", "Jabra", "Logitech", "Crestron",
  // Cable / Accessories
  "StarTech", "C2G", "Tripp",
];

let totalIngramProducts = 0;

for (const term of searchTerms) {
  try {
    let pageNumber = 1;
    let hasMore = true;
    let termTotal = 0;

    while (hasMore && pageNumber <= 20) { // Cap at 20 pages per term = 2000 products
      const result = await ingramSearch({
        vendorName: term,
        pageSize: 100,
        pageNumber,
      });

      for (const p of result.products) {
        const vendorName = p.vendorName || "UNKNOWN";
        const existing = allBrands.get(vendorName);
        if (existing) {
          existing.count++;
        } else {
          allBrands.set(vendorName, {
            count: 1,
            sampleMpn: p.vendorPartNumber || "",
            sampleDesc: (p.description || "").slice(0, 80),
            distributor: "ingram",
            vendorNumber: p.vendorNumber || "",
          });
        }
        totalIngramProducts++;
        termTotal++;
      }

      hasMore = result.hasMore;
      pageNumber = result.nextPage;

      // Small delay to be polite
      await new Promise(r => setTimeout(r, 200));
    }

    if (termTotal > 0) {
      console.log(`  ${term}: ${termTotal} products (total records: ${totalIngramProducts})`);
    }
  } catch (err) {
    console.error(`  ${term}: ERROR - ${err.message.slice(0, 100)}`);
  }
}

console.log(`\nIngram Total: ${totalIngramProducts} products, ${allBrands.size} unique brands\n`);

// ---------------------------------------------------------------------------
// Phase 1b: D&H catalog discovery
// ---------------------------------------------------------------------------

console.log("--- PHASE 1b: D&H Catalog Crawl ---\n");

const dhSearchTerms = [
  "SonicWall", "Fortinet", "Cisco", "Palo Alto", "WatchGuard", "Aruba",
  "Juniper", "Sophos", "Ubiquiti", "Barracuda", "Meraki",
];

let totalDhProducts = 0;

for (const term of dhSearchTerms) {
  try {
    const items = await dhSearch(term);

    for (const item of items) {
      const vendorName = item.vendorName || "UNKNOWN";
      const existing = allBrands.get(vendorName);
      if (existing) {
        existing.count++;
        if (existing.distributor === "ingram") {
          existing.distributor = "ingram,dh"; // Seen in both
        }
      } else {
        allBrands.set(vendorName, {
          count: 1,
          sampleMpn: item.vendorItemId || "",
          sampleDesc: (item.description || "").slice(0, 80),
          distributor: "dh",
          vendorNumber: "",
        });
      }
      totalDhProducts++;
    }

    if (items.length > 0) {
      console.log(`  ${term}: ${items.length} products`);
    }

    await new Promise(r => setTimeout(r, 300));
  } catch (err) {
    console.error(`  ${term}: ERROR - ${err.message.slice(0, 100)}`);
  }
}

console.log(`\nD&H Total: ${totalDhProducts} products\n`);

// ---------------------------------------------------------------------------
// Phase 2: Output all discovered brands for mapping
// ---------------------------------------------------------------------------

console.log("=== ALL DISCOVERED BRANDS ===\n");

const sortedBrands = [...allBrands.entries()]
  .sort((a, b) => b[1].count - a[1].count);

for (const [name, info] of sortedBrands) {
  console.log(`${name} | count=${info.count} | dist=${info.distributor} | vendorNo=${info.vendorNumber} | mpn=${info.sampleMpn} | desc=${info.sampleDesc}`);
}

// Save to JSON for the mapping script
const brandData = sortedBrands.map(([name, info]) => ({
  rawName: name,
  count: info.count,
  distributor: info.distributor,
  vendorNumber: info.vendorNumber,
  sampleMpn: info.sampleMpn,
  sampleDesc: info.sampleDesc,
}));

fs.writeFileSync("/tmp/discovered-brands.json", JSON.stringify(brandData, null, 2));
console.log(`\nSaved ${brandData.length} brands to /tmp/discovered-brands.json`);
console.log(`\nGrand Total: ${totalIngramProducts + totalDhProducts} products across ${allBrands.size} brands`);
