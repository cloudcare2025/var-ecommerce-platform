/**
 * Centralized Configuration — Environment Variable Validation
 *
 * All FTP/SFTP/API credentials and sync-worker settings.
 * Uses lazy getters so env vars are validated on first access,
 * not at import time (which breaks Next.js build-time page collection).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Is this a Next.js build-time page collection phase? */
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  (process.env.NODE_ENV === "production" && typeof window === "undefined" && !process.env.INGRAM_CLIENT_ID);

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    // During Next.js "Collecting page data", sync env vars aren't available.
    // Return empty string so the build succeeds — runtime will have real values.
    if (isBuildPhase) return "";
    throw new Error(`[config] Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function optionalInt(name: string, fallback: number): number {
  const val = process.env[name];
  return val ? parseInt(val, 10) : fallback;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export const DATABASE_URL = required("DATABASE_URL");

// ---------------------------------------------------------------------------
// Ingram Micro API
// ---------------------------------------------------------------------------

export const ingramApi = {
  clientId: required("INGRAM_CLIENT_ID"),
  clientSecret: required("INGRAM_CLIENT_SECRET"),
  customerNumber: required("INGRAM_CUSTOMER_NUMBER"),
  senderId: required("INGRAM_SENDER_ID"),
};

// ---------------------------------------------------------------------------
// Ingram Micro SFTP (Price + Stock)
// ---------------------------------------------------------------------------

export const ingramSftp = {
  host: optional("INGRAM_SFTP_HOST", "mercury.ingrammicro.com"),
  port: optionalInt("INGRAM_SFTP_PORT", 22),
  price: {
    user: required("INGRAM_SFTP_PRICE_USER"),
    pass: required("INGRAM_SFTP_PRICE_PASS"),
  },
  stock: {
    user: required("INGRAM_SFTP_STOCK_USER"),
    pass: required("INGRAM_SFTP_STOCK_PASS"),
  },
};

// ---------------------------------------------------------------------------
// TD SYNNEX SFTP
// ---------------------------------------------------------------------------

export const synnexSftp = {
  host: optional("SYNNEX_SFTP_HOST", "sftp.us.tdsynnex.com"),
  port: optionalInt("SYNNEX_SFTP_PORT", 22),
  user: required("SYNNEX_SFTP_USER"),
  pass: required("SYNNEX_SFTP_PASS"),
};

// ---------------------------------------------------------------------------
// TD SYNNEX EC Express (XML PNA API)
// ---------------------------------------------------------------------------

export const synnexEc = {
  username: required("SYNNEX_EC_USERNAME"),
  password: required("SYNNEX_EC_PASSWORD"),
  account: required("SYNNEX_EC_ACCOUNT"),
};

// ---------------------------------------------------------------------------
// D&H API
// ---------------------------------------------------------------------------

export const dhApi = {
  clientId: required("DH_CLIENT_ID"),
  clientSecret: required("DH_CLIENT_SECRET"),
  account: required("DH_ACCOUNT"),
};

// ---------------------------------------------------------------------------
// D&H FTP
// ---------------------------------------------------------------------------

export const dhFtp = {
  host: optional("DH_FTP_HOST", "ftp.dandh.com"),
  port: optionalInt("DH_FTP_PORT", 21),
  user: required("DH_FTP_USER"),
  pass: required("DH_FTP_PASS"),
};

// ---------------------------------------------------------------------------
// Sync Worker Settings
// ---------------------------------------------------------------------------

export const worker = {
  /** Temp directory for FTP downloads */
  tmpDir: optional("SYNC_TMP_DIR", "/tmp/sync-worker"),
  /** Health check port */
  healthPort: optionalInt("HEALTH_PORT", 8080),
  /** Batch size for bulk upserts */
  batchSize: optionalInt("SYNC_BATCH_SIZE", 500),
  /** Timezone for cron schedules */
  timezone: optional("TZ", "America/New_York"),
};

// ---------------------------------------------------------------------------
// Sync API Key (for admin portal triggers)
// ---------------------------------------------------------------------------

export const syncApiKey = process.env.SYNC_API_KEY ?? "";
