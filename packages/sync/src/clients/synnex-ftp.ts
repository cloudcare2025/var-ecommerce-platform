/**
 * TD SYNNEX SFTP Client — Catalog & Stock Feed Downloads
 *
 * SFTP to sftp.us.tdsynnex.com:22 with legacy SSH key exchange.
 * user u698913
 *
 * Catalog feed: 698913.zip → .ap file (tilde-delimited, nightly)
 * Stock feed: 698913h.app (hourly, stock-only)
 */

import SftpClient from "ssh2-sftp-client";
import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";
import { synnexSftp, worker } from "../config";
import type { FtpDownloadResult } from "./ingram-ftp";

export type { FtpDownloadResult };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 3000;

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[synnex-ftp] ${label} attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
      if (attempt === MAX_RETRIES) throw err;
      const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function connectConfig(): Parameters<SftpClient["connect"]>[0] {
  return {
    host: synnexSftp.host,
    port: synnexSftp.port,
    username: synnexSftp.user,
    password: synnexSftp.pass,
    readyTimeout: 60_000,
    retries: 2,
    algorithms: {
      serverHostKey: ["ssh-rsa", "ssh-dss", "ecdsa-sha2-nistp256", "ssh-ed25519"],
    },
  };
}

// ---------------------------------------------------------------------------
// Catalog Feed ({accountNum}.zip → .ap file) [LEGACY — kept for backward compat]
// ---------------------------------------------------------------------------

export async function downloadCatalogFile(
  destDir?: string,
): Promise<FtpDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "synnex");
  ensureDir(dir);

  return withRetry("downloadCatalogFile", async () => {
    const sftp = new SftpClient();

    try {
      await sftp.connect(connectConfig());
      console.log("[synnex-ftp] Connected for catalog feed download");

      const listing = await sftp.list("/");

      // Find the account-specific .zip (e.g., 780980.zip or 698913.zip)
      const catalogZip = listing.find(
        (f) => f.name.match(/^\d+\.zip$/i) && f.type === "-",
      );

      if (!catalogZip) {
        throw new Error("No catalog .zip found on SYNNEX SFTP root");
      }

      const remoteSize = catalogZip.size;
      const remoteModified = new Date(catalogZip.modifyTime);
      const zipPath = path.join(dir, catalogZip.name);

      console.log(`[synnex-ftp] Downloading ${catalogZip.name} (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await sftp.fastGet(`/${catalogZip.name}`, zipPath);

      // Extract the .ap file
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      const apEntry = entries.find((e) => e.entryName.match(/\.ap$/i));

      if (!apEntry) {
        throw new Error(`No .ap file found inside ${catalogZip.name}`);
      }

      const apPath = path.join(dir, apEntry.entryName);
      zip.extractEntryTo(apEntry, dir, false, true);
      console.log(`[synnex-ftp] Extracted ${apEntry.entryName}`);

      // Clean up ZIP
      fs.unlinkSync(zipPath);

      return { localPath: apPath, remoteSize, remoteModified };
    } finally {
      await sftp.end().catch(() => {});
    }
  });
}

// ---------------------------------------------------------------------------
// Inv Report Feed (stock/inv_report.zip — daily, fresh pricing + stock)
// ---------------------------------------------------------------------------

export async function downloadInvReport(
  destDir?: string,
): Promise<FtpDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "synnex");
  ensureDir(dir);

  return withRetry("downloadInvReport", async () => {
    const sftp = new SftpClient();

    try {
      await sftp.connect(connectConfig());
      console.log("[synnex-ftp] Connected for inv_report download");

      const listing = await sftp.list("/stock");

      const invZip = listing.find(
        (f) => f.name.match(/^inv_report\.zip$/i) && f.type === "-",
      );

      if (!invZip) {
        throw new Error("inv_report.zip not found in stock/ on SYNNEX SFTP");
      }

      const remoteSize = invZip.size;
      const remoteModified = new Date(invZip.modifyTime);
      const zipPath = path.join(dir, "inv_report.zip");

      console.log(`[synnex-ftp] Downloading stock/${invZip.name} (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await sftp.fastGet(`/stock/${invZip.name}`, zipPath);

      // Extract the .app file
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      const appEntry = entries.find((e) => e.entryName.match(/inv_report\.app$/i));

      if (!appEntry) {
        throw new Error("No inv_report.app file found inside inv_report.zip");
      }

      const appPath = path.join(dir, appEntry.entryName);
      zip.extractEntryTo(appEntry, dir, false, true);
      console.log(`[synnex-ftp] Extracted ${appEntry.entryName}`);

      // Clean up ZIP
      fs.unlinkSync(zipPath);

      return { localPath: appPath, remoteSize, remoteModified };
    } finally {
      await sftp.end().catch(() => {});
    }
  });
}

// ---------------------------------------------------------------------------
// Inv Report Delta (stock/inv_report_delta.app — daily changes)
// ---------------------------------------------------------------------------

export async function downloadInvDelta(
  destDir?: string,
): Promise<FtpDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "synnex");
  ensureDir(dir);

  return withRetry("downloadInvDelta", async () => {
    const sftp = new SftpClient();

    try {
      await sftp.connect(connectConfig());
      console.log("[synnex-ftp] Connected for inv_report_delta download");

      const listing = await sftp.list("/stock");
      const deltaFile = listing.find(
        (f) => f.name.match(/^inv_report_delta\.app$/i) && f.type === "-",
      );

      if (!deltaFile) {
        throw new Error("inv_report_delta.app not found in stock/ on SYNNEX SFTP");
      }

      const remoteSize = deltaFile.size;
      const remoteModified = new Date(deltaFile.modifyTime);
      const localPath = path.join(dir, "inv_report_delta.app");

      console.log(`[synnex-ftp] Downloading stock/${deltaFile.name} (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await sftp.fastGet(`/stock/${deltaFile.name}`, localPath);

      return { localPath, remoteSize, remoteModified };
    } finally {
      await sftp.end().catch(() => {});
    }
  });
}

// ---------------------------------------------------------------------------
// Stock Feed ({accountNum}h.app — hourly) [LEGACY — kept for backward compat]
// ---------------------------------------------------------------------------

export async function downloadStockFile(
  destDir?: string,
): Promise<FtpDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "synnex");
  ensureDir(dir);

  return withRetry("downloadStockFile", async () => {
    const sftp = new SftpClient();

    try {
      await sftp.connect(connectConfig());
      console.log("[synnex-ftp] Connected for stock feed download");

      const listing = await sftp.list("/");
      // Find the account-specific hourly stock file (e.g., 780980h.app)
      const stockFile = listing.find(
        (f) => f.name.match(/^\d+h\.app$/i) && f.type === "-",
      );

      if (!stockFile) {
        throw new Error("No hourly stock .app file found on SYNNEX SFTP root");
      }

      const remoteSize = stockFile.size;
      const remoteModified = new Date(stockFile.modifyTime);
      const localPath = path.join(dir, stockFile.name);

      console.log(`[synnex-ftp] Downloading ${stockFile.name} (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await sftp.fastGet(`/${stockFile.name}`, localPath);

      return { localPath, remoteSize, remoteModified };
    } finally {
      await sftp.end().catch(() => {});
    }
  });
}

// ---------------------------------------------------------------------------
// File stat
// ---------------------------------------------------------------------------

export async function getRemoteFileInfo(
  feed: "catalog" | "stock" | "inv_report" | "inv_delta",
): Promise<{ size: number; modified: Date } | null> {
  const sftp = new SftpClient();

  // Pattern-based matching for account-specific files, exact match for stock/ files
  const feedConfig: Record<typeof feed, { dir: string; pattern: RegExp }> = {
    catalog: { dir: "/", pattern: /^\d+\.zip$/i },
    stock: { dir: "/", pattern: /^\d+h\.app$/i },
    inv_report: { dir: "/stock", pattern: /^inv_report\.zip$/i },
    inv_delta: { dir: "/stock", pattern: /^inv_report_delta\.app$/i },
  };

  const { dir, pattern } = feedConfig[feed];

  try {
    await sftp.connect(connectConfig());

    const listing = await sftp.list(dir);
    const file = listing.find(
      (f) => pattern.test(f.name) && f.type === "-",
    );

    if (!file) return null;
    return { size: file.size, modified: new Date(file.modifyTime) };
  } catch {
    return null;
  } finally {
    await sftp.end().catch(() => {});
  }
}
