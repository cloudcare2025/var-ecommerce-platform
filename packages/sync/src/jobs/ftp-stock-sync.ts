/**
 * FTP Stock Sync — Lightweight Stock-Only Updates
 *
 * Ingram: Downloads TOTAL.TXT every 3 hours, batch-updates total_quantity
 * SYNNEX: Downloads 698913h.app every hour, batch-updates total_quantity
 * D&H: No separate stock feed — stock comes with ITEMLIST during nightly sync
 */

import { prisma } from "@var/database";
import { downloadStockFile as downloadIngramStock } from "../clients/ingram-ftp";
import { downloadStockFile as downloadSynnexStock } from "../clients/synnex-ftp";
import { parseIngramStockFile } from "../parsers/ingram-stock";
import { parseSynnexStockFile } from "../parsers/synnex-catalog";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StockSyncResult {
  jobId: string;
  distributor: string;
  itemsProcessed: number;
  itemsUpdated: number;
  itemsFailed: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Batch Stock Update via Raw SQL
// ---------------------------------------------------------------------------

const BATCH_SIZE = 2000;

async function batchUpdateStock(
  table: "ingram_listings" | "synnex_listings",
  skuColumn: "distributor_sku",
  updates: Array<{ sku: string; quantity: number }>,
): Promise<number> {
  if (updates.length === 0) return 0;

  const skus: string[] = [];
  const qtys: number[] = [];

  for (const u of updates) {
    skus.push(u.sku);
    qtys.push(u.quantity);
  }

  const result = await prisma.$executeRawUnsafe(
    `UPDATE ${table} AS t SET
      total_quantity = u.qty,
      last_synced_at = NOW(),
      updated_at = NOW()
    FROM UNNEST($1::text[], $2::bigint[]) AS u(sku, qty)
    WHERE t.${skuColumn} = u.sku`,
    skus,
    qtys,
  );

  return result;
}

// ---------------------------------------------------------------------------
// Ingram Stock Sync
// ---------------------------------------------------------------------------

async function syncIngramStock(): Promise<StockSyncResult> {
  const startTime = Date.now();

  // Check/update FTP sync state
  const state = await prisma.ftpSyncState.upsert({
    where: { distributor_feedType: { distributor: "ingram", feedType: "stock" } },
    update: {},
    create: { distributor: "ingram", feedType: "stock" },
  });

  if (state.lastStatus === "running") {
    console.log("[ftp-stock-sync] Ingram stock sync already running, skipping");
    return { jobId: "", distributor: "ingram", itemsProcessed: 0, itemsUpdated: 0, itemsFailed: 0, durationMs: 0 };
  }

  await prisma.ftpSyncState.update({
    where: { distributor_feedType: { distributor: "ingram", feedType: "stock" } },
    data: { lastStatus: "running", lastRunAt: new Date(), errorMessage: null },
  });

  const job = await prisma.syncJob.create({
    data: { jobType: "ftp_stock", distributor: "ingram", status: "running" },
  });

  try {
    const downloadResult = await downloadIngramStock();

    let processed = 0;
    let updated = 0;
    let batch: Array<{ sku: string; quantity: number }> = [];

    for await (const record of parseIngramStockFile(downloadResult.localPath)) {
      batch.push(record);
      processed++;

      if (batch.length >= BATCH_SIZE) {
        updated += await batchUpdateStock("ingram_listings", "distributor_sku", batch);
        batch = [];

        if (processed % 100_000 === 0) {
          console.log(`[ftp-stock-sync] Ingram: ${processed.toLocaleString()} processed, ${updated.toLocaleString()} updated`);
        }
      }
    }

    if (batch.length > 0) {
      updated += await batchUpdateStock("ingram_listings", "distributor_sku", batch);
    }

    // Clean up
    fs.unlinkSync(downloadResult.localPath);

    const durationMs = Date.now() - startTime;

    await prisma.ftpSyncState.update({
      where: { distributor_feedType: { distributor: "ingram", feedType: "stock" } },
      data: {
        lastStatus: "completed",
        itemsProcessed: processed,
        itemsUpdated: updated,
        fileName: "TOTAL.TXT",
        fileSize: BigInt(downloadResult.remoteSize),
        fileModified: downloadResult.remoteModified,
      },
    });

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        itemsProcessed: processed,
        itemsUpdated: updated,
        completedAt: new Date(),
      },
    });

    console.log(
      `[ftp-stock-sync] Ingram stock complete: ${processed.toLocaleString()} processed, ${updated.toLocaleString()} updated (${(durationMs / 1000).toFixed(1)}s)`,
    );

    return { jobId: job.id, distributor: "ingram", itemsProcessed: processed, itemsUpdated: updated, itemsFailed: 0, durationMs };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.ftpSyncState.update({
      where: { distributor_feedType: { distributor: "ingram", feedType: "stock" } },
      data: { lastStatus: "failed", errorMessage: msg.slice(0, 2000) },
    });
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "failed", errorLog: [msg], completedAt: new Date() },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// SYNNEX Stock Sync
// ---------------------------------------------------------------------------

async function syncSynnexStock(): Promise<StockSyncResult> {
  const startTime = Date.now();

  const state = await prisma.ftpSyncState.upsert({
    where: { distributor_feedType: { distributor: "synnex", feedType: "stock" } },
    update: {},
    create: { distributor: "synnex", feedType: "stock" },
  });

  if (state.lastStatus === "running") {
    console.log("[ftp-stock-sync] SYNNEX stock sync already running, skipping");
    return { jobId: "", distributor: "synnex", itemsProcessed: 0, itemsUpdated: 0, itemsFailed: 0, durationMs: 0 };
  }

  await prisma.ftpSyncState.update({
    where: { distributor_feedType: { distributor: "synnex", feedType: "stock" } },
    data: { lastStatus: "running", lastRunAt: new Date(), errorMessage: null },
  });

  const job = await prisma.syncJob.create({
    data: { jobType: "ftp_stock", distributor: "synnex", status: "running" },
  });

  try {
    const downloadResult = await downloadSynnexStock();

    let processed = 0;
    let updated = 0;
    let batch: Array<{ sku: string; quantity: number }> = [];

    for await (const record of parseSynnexStockFile(downloadResult.localPath)) {
      batch.push(record);
      processed++;

      if (batch.length >= BATCH_SIZE) {
        updated += await batchUpdateStock("synnex_listings", "distributor_sku", batch);
        batch = [];

        if (processed % 50_000 === 0) {
          console.log(`[ftp-stock-sync] SYNNEX: ${processed.toLocaleString()} processed, ${updated.toLocaleString()} updated`);
        }
      }
    }

    if (batch.length > 0) {
      updated += await batchUpdateStock("synnex_listings", "distributor_sku", batch);
    }

    // Clean up
    fs.unlinkSync(downloadResult.localPath);

    const durationMs = Date.now() - startTime;

    await prisma.ftpSyncState.update({
      where: { distributor_feedType: { distributor: "synnex", feedType: "stock" } },
      data: {
        lastStatus: "completed",
        itemsProcessed: processed,
        itemsUpdated: updated,
        fileName: "698913h.app",
        fileSize: BigInt(downloadResult.remoteSize),
        fileModified: downloadResult.remoteModified,
      },
    });

    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        itemsProcessed: processed,
        itemsUpdated: updated,
        completedAt: new Date(),
      },
    });

    console.log(
      `[ftp-stock-sync] SYNNEX stock complete: ${processed.toLocaleString()} processed, ${updated.toLocaleString()} updated (${(durationMs / 1000).toFixed(1)}s)`,
    );

    return { jobId: job.id, distributor: "synnex", itemsProcessed: processed, itemsUpdated: updated, itemsFailed: 0, durationMs };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.ftpSyncState.update({
      where: { distributor_feedType: { distributor: "synnex", feedType: "stock" } },
      data: { lastStatus: "failed", errorMessage: msg.slice(0, 2000) },
    });
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

export async function runFtpStockSync(
  distributor: "ingram" | "synnex",
): Promise<StockSyncResult> {
  switch (distributor) {
    case "ingram":
      return syncIngramStock();
    case "synnex":
      return syncSynnexStock();
    default:
      throw new Error(`No separate stock feed for distributor: ${distributor}`);
  }
}
