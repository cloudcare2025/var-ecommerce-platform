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
// Catalog Feed (698913.zip → .ap file)
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

      // Look for 698913.zip or similar catalog zip
      const catalogZip = listing.find(
        (f) => f.name.match(/^698913\.zip$/i) && f.type === "-",
      );

      if (!catalogZip) {
        throw new Error("698913.zip not found on SYNNEX SFTP");
      }

      const remoteSize = catalogZip.size;
      const remoteModified = new Date(catalogZip.modifyTime);
      const zipPath = path.join(dir, "698913.zip");

      console.log(`[synnex-ftp] Downloading ${catalogZip.name} (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await sftp.fastGet(`/${catalogZip.name}`, zipPath);

      // Extract the .ap file
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      const apEntry = entries.find((e) => e.entryName.match(/\.ap$/i));

      if (!apEntry) {
        throw new Error("No .ap file found inside 698913.zip");
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
// Stock Feed (698913h.app — hourly)
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
      const stockFile = listing.find(
        (f) => f.name.match(/^698913h\.app$/i) && f.type === "-",
      );

      if (!stockFile) {
        throw new Error("698913h.app not found on SYNNEX SFTP");
      }

      const remoteSize = stockFile.size;
      const remoteModified = new Date(stockFile.modifyTime);
      const localPath = path.join(dir, "698913h.app");

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
  feed: "catalog" | "stock",
): Promise<{ size: number; modified: Date } | null> {
  const sftp = new SftpClient();
  const fileName = feed === "catalog" ? "698913.zip" : "698913h.app";

  try {
    await sftp.connect(connectConfig());

    const listing = await sftp.list("/");
    const file = listing.find(
      (f) => f.name.toLowerCase() === fileName.toLowerCase() && f.type === "-",
    );

    if (!file) return null;
    return { size: file.size, modified: new Date(file.modifyTime) };
  } catch {
    return null;
  } finally {
    await sftp.end().catch(() => {});
  }
}
