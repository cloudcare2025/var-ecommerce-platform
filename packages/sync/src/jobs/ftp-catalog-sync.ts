/**
 * FTP Catalog Sync — Nightly Full Catalog Import
 *
 * Downloads FTP bulk feeds, parses them, and bulk-upserts into
 * per-distributor tables with brand resolution.
 * Runs nightly at 2am ET.
 */

import { prisma } from "@var/database";
import { downloadPriceFile } from "../clients/ingram-ftp";
import { downloadCatalogFile as downloadSynnexCatalog } from "../clients/synnex-ftp";
import { downloadCatalogFiles as downloadDhCatalog } from "../clients/dh-ftp";
import { parseIngramPriceFile } from "../parsers/ingram-price";
import { loadStockMap } from "../parsers/ingram-stock";
import { parseSynnexCatalogFile } from "../parsers/synnex-catalog";
import { parseDhCatalogFile } from "../parsers/dh-catalog";
import { parseDhCategoryFile } from "../parsers/dh-category";
import { bulkUpsertFromFtp, type ParsedRecord } from "../pipelines/bulk-upsert";
import { downloadStockFile as downloadIngramStock } from "../clients/ingram-ftp";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncJobResult {
  jobId: string;
  distributor: string;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsFailed: number;
  durationMs: number;
}

type Distributor = "ingram" | "synnex" | "dh";

// ---------------------------------------------------------------------------
// FTP Sync State Management
// ---------------------------------------------------------------------------

async function getOrCreateSyncState(distributor: string, feedType: string) {
  return prisma.ftpSyncState.upsert({
    where: { distributor_feedType: { distributor, feedType } },
    update: {},
    create: { distributor, feedType },
  });
}

async function markRunning(distributor: string, feedType: string) {
  await prisma.ftpSyncState.update({
    where: { distributor_feedType: { distributor, feedType } },
    data: { lastStatus: "running", lastRunAt: new Date(), errorMessage: null },
  });
}

async function markCompleted(
  distributor: string,
  feedType: string,
  stats: { processed: number; created: number; updated: number; failed: number },
  fileInfo?: { name?: string; size?: number; modified?: Date },
) {
  await prisma.ftpSyncState.update({
    where: { distributor_feedType: { distributor, feedType } },
    data: {
      lastStatus: "completed",
      itemsProcessed: stats.processed,
      itemsCreated: stats.created,
      itemsUpdated: stats.updated,
      itemsFailed: stats.failed,
      ...(fileInfo?.name && { fileName: fileInfo.name }),
      ...(fileInfo?.size && { fileSize: BigInt(fileInfo.size) }),
      ...(fileInfo?.modified && { fileModified: fileInfo.modified }),
    },
  });
}

async function markFailed(distributor: string, feedType: string, error: string) {
  await prisma.ftpSyncState.update({
    where: { distributor_feedType: { distributor, feedType } },
    data: { lastStatus: "failed", errorMessage: error.slice(0, 2000) },
  });
}

// ---------------------------------------------------------------------------
// Check if file has changed
// ---------------------------------------------------------------------------

async function shouldSync(
  distributor: string,
  feedType: string,
  remoteSize: number,
  remoteModified: Date,
): Promise<boolean> {
  const state = await getOrCreateSyncState(distributor, feedType);

  // Always sync if never run
  if (!state.lastRunAt) return true;

  // Skip if currently running
  if (state.lastStatus === "running") {
    console.log(`[ftp-catalog-sync] ${distributor}/${feedType} already running, skipping`);
    return false;
  }

  // Check if file changed
  if (
    state.fileSize !== null &&
    state.fileModified !== null &&
    BigInt(remoteSize) === state.fileSize &&
    remoteModified.getTime() === state.fileModified.getTime()
  ) {
    console.log(`[ftp-catalog-sync] ${distributor}/${feedType} file unchanged, skipping`);
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Ingram Catalog Sync
// ---------------------------------------------------------------------------

async function syncIngramCatalog(): Promise<SyncJobResult> {
  const distributor = "ingram";
  const feedType = "catalog";

  await getOrCreateSyncState(distributor, feedType);
  await markRunning(distributor, feedType);

  const job = await prisma.syncJob.create({
    data: { jobType: "ftp_catalog", distributor, status: "running" },
  });

  try {
    // Download price file
    const priceResult = await downloadPriceFile();

    // Also try to download stock file for enrichment
    let stockMap = new Map<string, number>();
    try {
      const stockResult = await downloadIngramStock();
      stockMap = await loadStockMap(stockResult.localPath);
      console.log(`[ftp-catalog-sync] Loaded ${stockMap.size} Ingram stock entries`);
      fs.unlinkSync(stockResult.localPath);
    } catch (err) {
      console.warn(`[ftp-catalog-sync] Could not load Ingram stock data: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Create record adapter that enriches with stock data
    async function* adaptRecords(): AsyncGenerator<ParsedRecord> {
      for await (const rec of parseIngramPriceFile(priceResult.localPath)) {
        const totalQuantity = stockMap.get(rec.ingramSku) ?? 0;
        yield {
          distributor: "ingram",
          distributorSku: rec.ingramSku,
          mpn: rec.mpn,
          name: rec.description || rec.mpn,
          description: rec.description,
          category: rec.category,
          subCategory: rec.subCategory,
          rawVendorName: rec.vendorName,
          rawMfgCode: rec.vendorCode,
          costPrice: rec.customerPrice,
          retailPrice: rec.retailPrice,
          mapPrice: rec.mapPrice,
          totalQuantity,
          upc: rec.upc,
          weight: rec.weight,
          vendorNumber: rec.vendorNumber,
        };
      }
    }

    const result = await bulkUpsertFromFtp("ingram", adaptRecords(), {
      onProgress: (stats) => {
        const rate = stats.elapsed > 0 ? Math.round((stats.processed / stats.elapsed) * 60_000) : 0;
        console.log(`[ftp-catalog-sync] Ingram: ${stats.processed.toLocaleString()} processed, ${stats.created.toLocaleString()} created, ${stats.failed} failed (${rate}/min)`);
      },
    });

    // Clean up
    fs.unlinkSync(priceResult.localPath);

    await markCompleted(distributor, feedType, {
      processed: result.itemsProcessed,
      created: result.itemsCreated,
      updated: result.itemsUpdated,
      failed: result.itemsFailed,
    }, {
      name: "PRICE.TXT",
      size: priceResult.remoteSize,
      modified: priceResult.remoteModified,
    });

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        itemsProcessed: result.itemsProcessed,
        itemsCreated: result.itemsCreated,
        itemsUpdated: result.itemsUpdated,
        itemsFailed: result.itemsFailed,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      distributor,
      itemsProcessed: result.itemsProcessed,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      itemsFailed: result.itemsFailed,
      durationMs: result.durationMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(distributor, feedType, msg);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "failed", errorLog: [msg], completedAt: new Date() },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// SYNNEX Catalog Sync
// ---------------------------------------------------------------------------

async function syncSynnexCatalog(): Promise<SyncJobResult> {
  const distributor = "synnex";
  const feedType = "catalog";

  await getOrCreateSyncState(distributor, feedType);
  await markRunning(distributor, feedType);

  const job = await prisma.syncJob.create({
    data: { jobType: "ftp_catalog", distributor, status: "running" },
  });

  try {
    const downloadResult = await downloadSynnexCatalog();

    async function* adaptRecords(): AsyncGenerator<ParsedRecord> {
      for await (const rec of parseSynnexCatalogFile(downloadResult.localPath)) {
        yield {
          distributor: "synnex",
          distributorSku: rec.synnexSku,
          mpn: rec.mpn,
          name: rec.description || rec.mpn,
          description: rec.description,
          category: rec.category,
          subCategory: null,
          rawVendorName: rec.vendorName,
          rawMfgCode: rec.mfgCode,
          costPrice: rec.costPrice,
          retailPrice: rec.retailPrice,
          totalQuantity: rec.totalQuantity,
          upc: rec.upc,
          weight: rec.weight,
        };
      }
    }

    const result = await bulkUpsertFromFtp("synnex", adaptRecords(), {
      onProgress: (stats) => {
        const rate = stats.elapsed > 0 ? Math.round((stats.processed / stats.elapsed) * 60_000) : 0;
        console.log(`[ftp-catalog-sync] SYNNEX: ${stats.processed.toLocaleString()} processed, ${stats.created.toLocaleString()} created, ${stats.failed} failed (${rate}/min)`);
      },
    });

    fs.unlinkSync(downloadResult.localPath);

    await markCompleted(distributor, feedType, {
      processed: result.itemsProcessed,
      created: result.itemsCreated,
      updated: result.itemsUpdated,
      failed: result.itemsFailed,
    }, {
      name: "698913.ap",
      size: downloadResult.remoteSize,
      modified: downloadResult.remoteModified,
    });

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        itemsProcessed: result.itemsProcessed,
        itemsCreated: result.itemsCreated,
        itemsUpdated: result.itemsUpdated,
        itemsFailed: result.itemsFailed,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      distributor,
      itemsProcessed: result.itemsProcessed,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      itemsFailed: result.itemsFailed,
      durationMs: result.durationMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(distributor, feedType, msg);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "failed", errorLog: [msg], completedAt: new Date() },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// D&H Catalog Sync
// ---------------------------------------------------------------------------

async function syncDhCatalog(): Promise<SyncJobResult> {
  const distributor = "dh";
  const feedType = "catalog";

  await getOrCreateSyncState(distributor, feedType);
  await markRunning(distributor, feedType);

  const job = await prisma.syncJob.create({
    data: { jobType: "ftp_catalog", distributor, status: "running" },
  });

  try {
    const downloadResult = await downloadDhCatalog();

    // Parse category file first
    const categoryMap = parseDhCategoryFile(downloadResult.categoryPath);
    console.log(`[ftp-catalog-sync] D&H: Loaded ${categoryMap.size} categories`);

    async function* adaptRecords(): AsyncGenerator<ParsedRecord> {
      for await (const rec of parseDhCatalogFile(downloadResult.itemlistPath, categoryMap)) {
        yield {
          distributor: "dh",
          distributorSku: rec.dhItemNumber,
          mpn: rec.mpn,
          name: rec.shortDescription || rec.longDescription?.substring(0, 200) || rec.mpn,
          description: rec.longDescription || rec.shortDescription,
          category: rec.categoryName,
          subCategory: rec.subcategoryName,
          rawVendorName: rec.vendorName,
          rawMfgCode: null,
          costPrice: rec.unitCost,
          retailPrice: rec.msrp,
          mapPrice: rec.mapPrice,
          totalQuantity: rec.qtyAvailable,
          upc: rec.upc,
          weight: rec.weight > 0 ? String(rec.weight) : null,
          stockStatus: rec.stockStatus,
        };
      }
    }

    const result = await bulkUpsertFromFtp("dh", adaptRecords(), {
      onProgress: (stats) => {
        const rate = stats.elapsed > 0 ? Math.round((stats.processed / stats.elapsed) * 60_000) : 0;
        console.log(`[ftp-catalog-sync] D&H: ${stats.processed.toLocaleString()} processed, ${stats.created.toLocaleString()} created, ${stats.failed} failed (${rate}/min)`);
      },
    });

    // Clean up
    fs.unlinkSync(downloadResult.itemlistPath);
    fs.unlinkSync(downloadResult.categoryPath);

    await markCompleted(distributor, feedType, {
      processed: result.itemsProcessed,
      created: result.itemsCreated,
      updated: result.itemsUpdated,
      failed: result.itemsFailed,
    }, {
      name: "ITEMLIST",
      size: downloadResult.remoteSize,
      modified: downloadResult.remoteModified,
    });

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        itemsProcessed: result.itemsProcessed,
        itemsCreated: result.itemsCreated,
        itemsUpdated: result.itemsUpdated,
        itemsFailed: result.itemsFailed,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      distributor,
      itemsProcessed: result.itemsProcessed,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      itemsFailed: result.itemsFailed,
      durationMs: result.durationMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(distributor, feedType, msg);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "failed", errorLog: [msg], completedAt: new Date() },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

export async function runFtpCatalogSync(
  distributor?: Distributor,
): Promise<SyncJobResult[]> {
  const distributors: Distributor[] = distributor
    ? [distributor]
    : ["ingram", "synnex", "dh"];

  const results: SyncJobResult[] = [];

  for (const dist of distributors) {
    try {
      console.log(`\n[ftp-catalog-sync] Starting ${dist} catalog sync...`);

      let result: SyncJobResult;
      switch (dist) {
        case "ingram":
          result = await syncIngramCatalog();
          break;
        case "synnex":
          result = await syncSynnexCatalog();
          break;
        case "dh":
          result = await syncDhCatalog();
          break;
      }

      results.push(result);
      console.log(
        `[ftp-catalog-sync] ${dist} complete: ${result.itemsProcessed} processed, ${result.itemsCreated} created (${(result.durationMs / 1000).toFixed(1)}s)`,
      );
    } catch (err) {
      console.error(
        `[ftp-catalog-sync] ${dist} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return results;
}
