import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface BrandSeed {
  canonicalName: string;
  slug: string;
  shortName?: string;
  aliases: string[];
  children?: BrandSeed[];
}

const brands: BrandSeed[] = [
  // ─── CORE NETWORKING / SECURITY ──────────────────────────────────────────
  {
    canonicalName: "SonicWall",
    slug: "sonicwall",
    aliases: [
      "SonicWall",
      "SonicWALL",
      "SONICWALL",
      "Sonic Wall",
      "SonicWall Inc",
      "SonicWall Inc.",
    ],
  },
  {
    canonicalName: "Hewlett Packard Enterprise",
    slug: "hpe",
    shortName: "HPE",
    aliases: [
      "Hewlett Packard Enterprise",
      "HPE",
      "HP Enterprise",
      "Hewlett-Packard Enterprise",
    ],
    children: [
      {
        canonicalName: "Aruba",
        slug: "aruba",
        aliases: [
          "Aruba",
          "HPE Aruba",
          "HPE Aruba Networking",
          "Aruba Networks",
          "ARUBA",
          "Aruba, a Hewlett Packard Enterprise company",
        ],
      },
    ],
  },
  {
    canonicalName: "Cisco",
    slug: "cisco",
    aliases: [
      "Cisco Systems",
      "CISCO",
      "Cisco Systems, Inc.",
      "Cisco",
    ],
    children: [
      {
        canonicalName: "Meraki",
        slug: "meraki",
        aliases: ["Cisco Meraki", "Meraki", "MERAKI"],
      },
    ],
  },
  {
    canonicalName: "Fortinet",
    slug: "fortinet",
    aliases: [
      "Fortinet",
      "FORTINET",
      "Fortinet Inc",
      "Fortinet, Inc.",
    ],
  },
  {
    canonicalName: "Palo Alto Networks",
    slug: "palo-alto-networks",
    shortName: "PAN",
    aliases: [
      "Palo Alto Networks",
      "PALO ALTO",
      "PAN",
      "Palo Alto Networks, Inc.",
    ],
  },
  {
    canonicalName: "Juniper Networks",
    slug: "juniper",
    shortName: "Juniper",
    aliases: [
      "Juniper Networks",
      "JUNIPER",
      "Juniper Networks, Inc.",
      "Juniper",
    ],
  },
  {
    canonicalName: "Ubiquiti",
    slug: "ubiquiti",
    aliases: [
      "Ubiquiti",
      "UBIQUITI",
      "Ubiquiti Inc.",
      "Ubiquiti Networks",
      "Ubiquiti Inc",
    ],
  },

  // ─── COMPUTE / OEM ───────────────────────────────────────────────────────
  {
    canonicalName: "Dell Technologies",
    slug: "dell",
    shortName: "Dell",
    aliases: [
      "Dell Technologies",
      "Dell",
      "DELL",
      "Dell EMC",
      "Dell Technologies Inc.",
    ],
  },
  {
    canonicalName: "Lenovo",
    slug: "lenovo",
    aliases: ["Lenovo", "LENOVO", "Lenovo Group", "Lenovo Inc."],
  },
  {
    canonicalName: "Microsoft",
    slug: "microsoft",
    aliases: [
      "Microsoft",
      "MICROSOFT",
      "Microsoft Corporation",
      "Microsoft Corp",
    ],
  },
  {
    canonicalName: "Apple",
    slug: "apple",
    aliases: ["Apple", "APPLE", "Apple Inc.", "Apple Inc"],
  },
  {
    canonicalName: "Samsung",
    slug: "samsung",
    aliases: [
      "Samsung",
      "SAMSUNG",
      "Samsung Electronics",
      "Samsung Electronics Co.",
    ],
  },
  {
    canonicalName: "Intel",
    slug: "intel",
    aliases: [
      "Intel",
      "INTEL",
      "Intel Corporation",
      "Intel Corp",
    ],
  },
  {
    canonicalName: "AMD",
    slug: "amd",
    aliases: [
      "AMD",
      "Advanced Micro Devices",
      "Advanced Micro Devices, Inc.",
    ],
  },
  {
    canonicalName: "NVIDIA",
    slug: "nvidia",
    aliases: [
      "NVIDIA",
      "Nvidia",
      "NVIDIA Corporation",
      "nVidia",
    ],
  },

  // ─── CONSUMER NETWORKING ─────────────────────────────────────────────────
  {
    canonicalName: "TP-Link",
    slug: "tp-link",
    aliases: [
      "TP-Link",
      "TP-LINK",
      "TPLINK",
      "TP Link",
    ],
  },
  {
    canonicalName: "NETGEAR",
    slug: "netgear",
    aliases: [
      "NETGEAR",
      "Netgear",
      "NETGEAR Inc.",
      "Netgear Inc",
    ],
  },
  {
    canonicalName: "D-Link",
    slug: "d-link",
    aliases: [
      "D-Link",
      "D-LINK",
      "DLink",
      "D-Link Corporation",
    ],
  },

  // ─── POWER / UPS ─────────────────────────────────────────────────────────
  {
    canonicalName: "APC",
    slug: "apc",
    aliases: [
      "APC",
      "APC by Schneider Electric",
      "American Power Conversion",
      "APC by Schneider",
    ],
  },
  {
    canonicalName: "CyberPower",
    slug: "cyberpower",
    aliases: [
      "CyberPower",
      "CYBERPOWER",
      "Cyber Power",
      "CyberPower Systems",
    ],
  },
  {
    canonicalName: "Tripp Lite",
    slug: "tripp-lite",
    aliases: [
      "Tripp Lite",
      "TRIPP LITE",
      "Tripp-Lite",
      "Tripp Lite by Eaton",
      "TrippLite",
    ],
  },

  // ─── SECURITY VENDORS ────────────────────────────────────────────────────
  {
    canonicalName: "WatchGuard",
    slug: "watchguard",
    aliases: [
      "WatchGuard",
      "WATCHGUARD",
      "WatchGuard Technologies",
      "WatchGuard Technologies, Inc.",
    ],
  },
  {
    canonicalName: "Sophos",
    slug: "sophos",
    aliases: [
      "Sophos",
      "SOPHOS",
      "Sophos Ltd",
      "Sophos Group",
    ],
  },
  {
    canonicalName: "Barracuda",
    slug: "barracuda",
    aliases: [
      "Barracuda",
      "BARRACUDA",
      "Barracuda Networks",
      "Barracuda Networks, Inc.",
    ],
  },
  {
    canonicalName: "Trend Micro",
    slug: "trend-micro",
    aliases: [
      "Trend Micro",
      "TREND MICRO",
      "TrendMicro",
      "Trend Micro Inc.",
    ],
  },
  {
    canonicalName: "ESET",
    slug: "eset",
    aliases: [
      "ESET",
      "Eset",
      "ESET LLC",
      "ESET Software",
    ],
  },

  // ─── BACKUP / VIRTUALIZATION ─────────────────────────────────────────────
  {
    canonicalName: "Datto",
    slug: "datto",
    aliases: [
      "Datto",
      "DATTO",
      "Datto Inc.",
      "Datto, a Kaseya company",
    ],
  },
  {
    canonicalName: "Acronis",
    slug: "acronis",
    aliases: [
      "Acronis",
      "ACRONIS",
      "Acronis International",
      "Acronis Inc.",
    ],
  },
  {
    canonicalName: "Veeam",
    slug: "veeam",
    aliases: [
      "Veeam",
      "VEEAM",
      "Veeam Software",
      "Veeam Software Group",
    ],
  },
  {
    canonicalName: "VMware",
    slug: "vmware",
    aliases: [
      "VMware",
      "VMWARE",
      "VMware Inc.",
      "VMware by Broadcom",
      "VMware, Inc.",
    ],
  },

  // ─── NAS / STORAGE ───────────────────────────────────────────────────────
  {
    canonicalName: "Synology",
    slug: "synology",
    aliases: [
      "Synology",
      "SYNOLOGY",
      "Synology Inc.",
      "Synology Inc",
    ],
  },
  {
    canonicalName: "QNAP",
    slug: "qnap",
    aliases: [
      "QNAP",
      "Qnap",
      "QNAP Systems",
      "QNAP Systems, Inc.",
    ],
  },
  {
    canonicalName: "Western Digital",
    slug: "western-digital",
    shortName: "WD",
    aliases: [
      "Western Digital",
      "WD",
      "WESTERN DIGITAL",
      "Western Digital Corporation",
    ],
  },
  {
    canonicalName: "Seagate",
    slug: "seagate",
    aliases: [
      "Seagate",
      "SEAGATE",
      "Seagate Technology",
      "Seagate Technology LLC",
    ],
  },

  // ─── PERIPHERALS / UC ────────────────────────────────────────────────────
  {
    canonicalName: "Logitech",
    slug: "logitech",
    aliases: [
      "Logitech",
      "LOGITECH",
      "Logitech International",
      "Logi",
    ],
  },
  {
    canonicalName: "Poly",
    slug: "poly",
    aliases: [
      "Poly",
      "POLY",
      "Plantronics",
      "Polycom",
      "Poly (HP)",
      "HP Poly",
    ],
  },
  {
    canonicalName: "Yealink",
    slug: "yealink",
    aliases: [
      "Yealink",
      "YEALINK",
      "Yealink Network Technology",
      "Yealink Inc.",
    ],
  },

  // ─── ENTERPRISE NETWORKING ───────────────────────────────────────────────
  {
    canonicalName: "Ruckus",
    slug: "ruckus",
    aliases: [
      "Ruckus",
      "RUCKUS",
      "Ruckus Networks",
      "Ruckus Wireless",
      "CommScope Ruckus",
    ],
  },
  {
    canonicalName: "Extreme Networks",
    slug: "extreme-networks",
    aliases: [
      "Extreme Networks",
      "EXTREME NETWORKS",
      "Extreme",
      "Extreme Networks, Inc.",
    ],
  },
  {
    canonicalName: "Cambium Networks",
    slug: "cambium-networks",
    aliases: [
      "Cambium Networks",
      "CAMBIUM",
      "Cambium",
      "Cambium Networks Ltd",
    ],
  },
  {
    canonicalName: "MikroTik",
    slug: "mikrotik",
    aliases: [
      "MikroTik",
      "MIKROTIK",
      "Mikrotik",
      "MikroTikls",
    ],
  },
  {
    canonicalName: "Cradlepoint",
    slug: "cradlepoint",
    aliases: [
      "Cradlepoint",
      "CRADLEPOINT",
      "Cradlepoint Inc.",
      "Cradlepoint by Ericsson",
    ],
  },

  // ─── INFRASTRUCTURE / CABLING ────────────────────────────────────────────
  {
    canonicalName: "Vertiv",
    slug: "vertiv",
    aliases: [
      "Vertiv",
      "VERTIV",
      "Vertiv Co.",
      "Vertiv Group",
    ],
  },
  {
    canonicalName: "StarTech",
    slug: "startech",
    aliases: [
      "StarTech",
      "STARTECH",
      "StarTech.com",
      "Startech.com",
    ],
  },
  {
    canonicalName: "Panduit",
    slug: "panduit",
    aliases: [
      "Panduit",
      "PANDUIT",
      "Panduit Corp",
      "Panduit Corporation",
    ],
  },
  {
    canonicalName: "CommScope",
    slug: "commscope",
    aliases: [
      "CommScope",
      "COMMSCOPE",
      "CommScope Inc.",
      "CommScope Holding",
    ],
  },
  {
    canonicalName: "DrayTek",
    slug: "draytek",
    aliases: [
      "DrayTek",
      "DRAYTEK",
      "Draytek Corp",
      "DrayTek Corporation",
    ],
  },
  {
    canonicalName: "Zyxel",
    slug: "zyxel",
    aliases: [
      "Zyxel",
      "ZYXEL",
      "ZyXEL",
      "Zyxel Communications",
      "Zyxel Networks",
    ],
  },
];

function normalizeAlias(alias: string): string {
  return alias
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\b(inc|llc|corp|ltd|gmbh|co|company|corporation)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function seedBrand(brand: BrandSeed, parentId?: string) {
  const manufacturer = await prisma.manufacturer.upsert({
    where: { canonicalName: brand.canonicalName },
    update: { shortName: brand.shortName, parentId },
    create: {
      canonicalName: brand.canonicalName,
      slug: brand.slug,
      shortName: brand.shortName,
      parentId,
    },
  });

  for (const alias of brand.aliases) {
    const normalized = normalizeAlias(alias);
    await prisma.manufacturerAlias.upsert({
      where: {
        aliasNormalized_source: {
          aliasNormalized: normalized,
          source: "manual",
        },
      },
      update: {},
      create: {
        alias,
        aliasNormalized: normalized,
        source: "manual",
        confidence: 1.0,
        isVerified: true,
        manufacturerId: manufacturer.id,
      },
    });
  }

  if (brand.children) {
    for (const child of brand.children) {
      await seedBrand(child, manufacturer.id);
    }
  }
}

async function main() {
  console.log("Seeding manufacturers...");
  for (const brand of brands) {
    await seedBrand(brand);
  }
  const count = await prisma.manufacturer.count();
  const aliasCount = await prisma.manufacturerAlias.count();
  console.log(
    `Seeded ${count} manufacturers with ${aliasCount} aliases.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
