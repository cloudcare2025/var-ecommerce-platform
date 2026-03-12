/**
 * D&H FTP Client — Catalog & Discontinued Feed Downloads
 *
 * Plain FTP to ftp.dandh.com:21
 * user 3254650000FTP
 *
 * Catalog feed: ITEMLIST (pipe-delimited)
 * Category feed: CATLIST (category code mapping)
 * Discontinued: DISCOITEM
 */

import { Client as FtpClient } from "basic-ftp";
import * as fs from "fs";
import * as path from "path";
import { dhFtp, worker } from "../config";
import type { FtpDownloadResult } from "./ingram-ftp";

export type { FtpDownloadResult };

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
      console.error(`[dh-ftp] ${label} attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
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

async function createFtpClient(): Promise<FtpClient> {
  const client = new FtpClient();
  client.ftp.verbose = false;

  await client.access({
    host: dhFtp.host,
    port: dhFtp.port,
    user: dhFtp.user,
    password: dhFtp.pass,
    secure: false,
  });

  return client;
}

// ---------------------------------------------------------------------------
// Catalog Files (ITEMLIST + CATEGORY)
// ---------------------------------------------------------------------------

export interface DhCatalogDownloadResult {
  itemlistPath: string;
  categoryPath: string;
  remoteSize: number;
  remoteModified: Date;
}

export async function downloadCatalogFiles(
  destDir?: string,
): Promise<DhCatalogDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "dh");
  ensureDir(dir);

  return withRetry("downloadCatalogFiles", async () => {
    const client = await createFtpClient();

    try {
      console.log("[dh-ftp] Connected for catalog feed download");

      // Get file info for ITEMLIST
      const listing = await client.list("/");
      const itemlistInfo = listing.find((f) => f.name === "ITEMLIST");
      const remoteSize = itemlistInfo?.size ?? 0;
      const remoteModified = itemlistInfo?.modifiedAt ?? new Date();

      // Download ITEMLIST
      const itemlistPath = path.join(dir, "ITEMLIST");
      console.log(`[dh-ftp] Downloading ITEMLIST (${(remoteSize / 1e6).toFixed(1)} MB)...`);
      await client.downloadTo(itemlistPath, "ITEMLIST");

      // Download CATLIST (category mapping)
      const categoryPath = path.join(dir, "CATLIST");
      console.log("[dh-ftp] Downloading CATLIST...");
      await client.downloadTo(categoryPath, "CATLIST");

      return { itemlistPath, categoryPath, remoteSize, remoteModified };
    } finally {
      client.close();
    }
  });
}

// ---------------------------------------------------------------------------
// Discontinued Items
// ---------------------------------------------------------------------------

export async function downloadDiscontinuedFile(
  destDir?: string,
): Promise<FtpDownloadResult> {
  const dir = destDir ?? path.join(worker.tmpDir, "dh");
  ensureDir(dir);

  return withRetry("downloadDiscontinuedFile", async () => {
    const client = await createFtpClient();

    try {
      console.log("[dh-ftp] Connected for discontinued feed download");

      const listing = await client.list("/");
      const discoInfo = listing.find((f) => f.name === "DISCOITEM");
      const remoteSize = discoInfo?.size ?? 0;
      const remoteModified = discoInfo?.modifiedAt ?? new Date();
      const localPath = path.join(dir, "DISCOITEM");

      console.log("[dh-ftp] Downloading DISCOITEM...");
      await client.downloadTo(localPath, "DISCOITEM");

      return { localPath, remoteSize, remoteModified };
    } finally {
      client.close();
    }
  });
}

// ---------------------------------------------------------------------------
// File stat
// ---------------------------------------------------------------------------

export async function getRemoteFileInfo(): Promise<{
  size: number;
  modified: Date;
} | null> {
  const client = new FtpClient();

  try {
    await client.access({
      host: dhFtp.host,
      port: dhFtp.port,
      user: dhFtp.user,
      password: dhFtp.pass,
      secure: false,
    });

    const listing = await client.list("/");
    const itemlist = listing.find((f) => f.name === "ITEMLIST");
    if (!itemlist) return null;

    return {
      size: itemlist.size,
      modified: itemlist.modifiedAt ?? new Date(),
    };
  } catch {
    return null;
  } finally {
    client.close();
  }
}
