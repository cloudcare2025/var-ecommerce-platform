/**
 * Sync Worker — Cron Scheduler Entry Point
 *
 * Main entry point for the sync-worker Railway service.
 * Registers cron jobs for:
 *   - Nightly FTP catalog sync (2am ET)
 *   - Ingram stock sync (every 3 hours)
 *   - SYNNEX stock sync (hourly)
 *   - API incremental P&A (hot: 5min, standard: 15min, cold: 30min)
 */

import cron from "node-cron";
import { runFtpCatalogSync } from "./jobs/ftp-catalog-sync";
import { runFtpStockSync } from "./jobs/ftp-stock-sync";
import { runIncrementalSync } from "./jobs/incremental-sync";
import { startHealthServer, stopHealthServer } from "./health";
import { prisma } from "@var/database";

// ---------------------------------------------------------------------------
// Job Locks — prevent overlapping runs
// ---------------------------------------------------------------------------

const runningJobs = new Set<string>();

async function guardedRun(
  jobName: string,
  fn: () => Promise<void>,
): Promise<void> {
  if (runningJobs.has(jobName)) {
    console.log(`[sync-worker] ${jobName} already running, skipping`);
    return;
  }

  runningJobs.add(jobName);
  const start = Date.now();

  try {
    await fn();
    console.log(`[sync-worker] ${jobName} completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error(`[sync-worker] ${jobName} failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    runningJobs.delete(jobName);
  }
}

// ---------------------------------------------------------------------------
// Register Cron Jobs
// ---------------------------------------------------------------------------

function registerCronJobs(): void {
  const tz = process.env.TZ || "America/New_York";

  // Catalog sync — nightly at 2am ET
  cron.schedule(
    "0 2 * * *",
    () => {
      guardedRun("ftp-catalog-all", async () => {
        await runFtpCatalogSync();
      });
    },
    { timezone: tz },
  );

  // Ingram stock sync — every 3 hours
  cron.schedule(
    "0 */3 * * *",
    () => {
      guardedRun("ftp-stock-ingram", async () => {
        await runFtpStockSync("ingram");
      });
    },
    { timezone: tz },
  );

  // SYNNEX stock sync — hourly
  cron.schedule(
    "0 * * * *",
    () => {
      guardedRun("ftp-stock-synnex", async () => {
        await runFtpStockSync("synnex");
      });
    },
    { timezone: tz },
  );

  // API incremental P&A — hot tier every 5 min
  cron.schedule("*/5 * * * *", () => {
    guardedRun("incremental-hot", async () => {
      await runIncrementalSync("hot");
    });
  });

  // API incremental P&A — standard tier every 15 min
  cron.schedule("*/15 * * * *", () => {
    guardedRun("incremental-standard", async () => {
      await runIncrementalSync("standard");
    });
  });

  // API incremental P&A — cold tier every 30 min
  cron.schedule("*/30 * * * *", () => {
    guardedRun("incremental-cold", async () => {
      await runIncrementalSync("cold");
    });
  });

  console.log("[sync-worker] Cron jobs registered:");
  console.log("  - 02:00 daily     → FTP catalog sync (all distributors)");
  console.log("  - */3h            → Ingram stock sync (TOTAL.TXT)");
  console.log("  - */1h            → SYNNEX stock sync (698913h.app)");
  console.log("  - */5m            → API incremental P&A (hot tier)");
  console.log("  - */15m           → API incremental P&A (standard tier)");
  console.log("  - */30m           → API incremental P&A (cold tier)");
}

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[sync-worker] Received ${signal}, shutting down gracefully...`);

  // Wait for running jobs to complete (with timeout)
  const maxWait = 120_000; // 2 minutes
  const start = Date.now();

  while (runningJobs.size > 0 && Date.now() - start < maxWait) {
    console.log(`[sync-worker] Waiting for ${runningJobs.size} running job(s): ${[...runningJobs].join(", ")}`);
    await new Promise((r) => setTimeout(r, 5000));
  }

  if (runningJobs.size > 0) {
    console.warn(`[sync-worker] Forcing shutdown with ${runningJobs.size} job(s) still running`);
  }

  await stopHealthServer();
  await prisma.$disconnect();

  console.log("[sync-worker] Shutdown complete");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=================================================================");
  console.log("  Sync Worker Starting");
  console.log(`  Node ${process.version}`);
  console.log(`  TZ: ${process.env.TZ || "America/New_York"}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log("=================================================================\n");

  // Validate DB connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("[sync-worker] Database connection verified");
  } catch (err) {
    console.error("[sync-worker] Database connection failed:", err);
    process.exit(1);
  }

  // Start health check server
  startHealthServer();

  // Register cron jobs
  registerCronJobs();

  // Register shutdown handlers
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  console.log("\n[sync-worker] Ready. Waiting for scheduled jobs...\n");
}

main().catch((err) => {
  console.error("[sync-worker] Fatal error:", err);
  process.exit(1);
});
