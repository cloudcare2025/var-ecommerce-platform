/**
 * Ingram Micro SFTP Client — Price & Stock Feed Downloads
 *
 * Price feed: user Y8FTMB → PRICE.ZIP → PRICE.TXT (673K products)
 * Stock feed: user US_AVAIL → TOTAL.TXT (3-hourly refresh)
 */

import SftpClient from "ssh2-sftp-client";
import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";
import { ingramSftp, worker } from "../config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FtpDownloadResult {
  localPath: string;
  remoteSize: number;
  remoteModified: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ingram-ftp] ${label} attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
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

// ---------------------------------------------------------------------------
// Price Feed (PRICE.ZIP → PRICE.TXT)
// ---------------------------------------------------------------------------

export async function downloadPriceFile(
  destDir?: string,
): Promise<FtpDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "ingram");
  ensureDir(dir);

  return withRetry("downloadPriceFile", async () => {
    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: ingramSftp.host,
        port: ingramSftp.port,
        username: ingramSftp.price.user,
        password: ingramSftp.price.pass,
        readyTimeout: 30_000,
        retries: 2,
      });

      console.log("[ingram-ftp] Connected for price feed download");

      // List root directory to find PRICE.ZIP
      const listing = await sftp.list("/");
      const priceZip = listing.find(
        (f) => f.name.toUpperCase() === "PRICE.ZIP" && f.type === "-",
      );

      if (!priceZip) {
        throw new Error("PRICE.ZIP not found on Ingram SFTP");
      }

      const remoteSize = priceZip.size;
      const remoteModified = new Date(priceZip.modifyTime);

      // Download ZIP
      const zipPath = path.join(dir, "PRICE.ZIP");
      console.log(`[ingram-ftp] Downloading PRICE.ZIP (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await sftp.fastGet("/PRICE.ZIP", zipPath);

      // Extract PRICE.TXT
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      const priceTxt = entries.find(
        (e) => e.entryName.toUpperCase() === "PRICE.TXT",
      );

      if (!priceTxt) {
        throw new Error("PRICE.TXT not found inside PRICE.ZIP");
      }

      const txtPath = path.join(dir, "PRICE.TXT");
      zip.extractEntryTo(priceTxt, dir, false, true);
      console.log("[ingram-ftp] Extracted PRICE.TXT");

      // Clean up ZIP
      fs.unlinkSync(zipPath);

      return { localPath: txtPath, remoteSize, remoteModified };
    } finally {
      await sftp.end().catch(() => {});
    }
  });
}

// ---------------------------------------------------------------------------
// Stock Feed (TOTAL.TXT)
// ---------------------------------------------------------------------------

export async function downloadStockFile(
  destDir?: string,
): Promise<FtpDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "ingram");
  ensureDir(dir);

  return withRetry("downloadStockFile", async () => {
    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: ingramSftp.host,
        port: ingramSftp.port,
        username: ingramSftp.stock.user,
        password: ingramSftp.stock.pass,
        readyTimeout: 30_000,
        retries: 2,
      });

      console.log("[ingram-ftp] Connected for stock feed download");

      const listing = await sftp.list("/");
      const totalTxt = listing.find(
        (f) => f.name.toUpperCase() === "TOTAL.TXT" && f.type === "-",
      );

      if (!totalTxt) {
        throw new Error("TOTAL.TXT not found on Ingram SFTP");
      }

      const remoteSize = totalTxt.size;
      const remoteModified = new Date(totalTxt.modifyTime);
      const localPath = path.join(dir, "TOTAL.TXT");

      console.log(`[ingram-ftp] Downloading TOTAL.TXT (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await sftp.fastGet(`/${totalTxt.name}`, localPath);

      return { localPath, remoteSize, remoteModified };
    } finally {
      await sftp.end().catch(() => {});
    }
  });
}

// ---------------------------------------------------------------------------
// File stat (check remote file without downloading)
// ---------------------------------------------------------------------------

export async function getRemoteFileInfo(
  feed: "price" | "stock",
): Promise<{ size: number; modified: Date } | null> {
  const sftp = new SftpClient();
  const creds = feed === "price" ? ingramSftp.price : ingramSftp.stock;
  const fileName = feed === "price" ? "PRICE.ZIP" : "TOTAL.TXT";

  try {
    await sftp.connect({
      host: ingramSftp.host,
      port: ingramSftp.port,
      username: creds.user,
      password: creds.pass,
      readyTimeout: 15_000,
    });

    const listing = await sftp.list("/");
    const file = listing.find(
      (f) => f.name.toUpperCase() === fileName && f.type === "-",
    );

    if (!file) return null;
    return { size: file.size, modified: new Date(file.modifyTime) };
  } catch {
    return null;
  } finally {
    await sftp.end().catch(() => {});
  }
}
