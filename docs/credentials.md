# Distributor API & FTP Credential Inventory

All credentials are stored as Railway environment variables on the `sync-worker` service.

## Ingram Micro

### REST API (Catalog Search + Price & Availability)
- **Portal**: https://developer.ingrammicro.com
- **Auth**: OAuth2 client_credentials at `https://api.ingrammicro.com:443/oauth/oauth20/token`
- **Customer Number**: 70-086662
- **Sender ID**: A5IT-SonicWall-Store
- **Rate Limits**: 55 req/min (catalog), 450 req/min (PNA)
- **Env Vars**: `INGRAM_CLIENT_ID`, `INGRAM_CLIENT_SECRET`, `INGRAM_CUSTOMER_NUMBER`, `INGRAM_SENDER_ID`

### SFTP - Price Feed
- **Host**: mercury.ingrammicro.com:22
- **Protocol**: SFTP
- **File**: PRICE.ZIP → PRICE.TXT (~673K products, nightly)
- **Format**: CSV, 25 comma-separated fields
- **Env Vars**: `INGRAM_SFTP_PRICE_USER`, `INGRAM_SFTP_PRICE_PASS`

### SFTP - Stock Feed
- **Host**: mercury.ingrammicro.com:22
- **Protocol**: SFTP
- **File**: TOTAL.TXT (refreshed every 3 hours)
- **Format**: `"SKU  ",quantity,"ETA     "`
- **Env Vars**: `INGRAM_SFTP_STOCK_USER`, `INGRAM_SFTP_STOCK_PASS`

---

## TD SYNNEX

### XML PNA API (Price & Availability by SKU/MPN)
- **Endpoint**: https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability
- **Auth**: EC Express credentials embedded in XML body (NOT OAuth)
- **Customer Number**: 698913
- **Rate Limit**: 25 req/min
- **Env Vars**: `SYNNEX_EC_USERNAME`, `SYNNEX_EC_PASSWORD`, `SYNNEX_EC_ACCOUNT`
- **Note**: Uses ECExpress login credentials, not REST API OAuth

### SFTP - Catalog Feed
- **Host**: sftp.us.tdsynnex.com:22
- **Protocol**: SFTP (requires legacy SSH key exchange: ssh-rsa, ssh-dss)
- **File**: 698913.zip → .ap file (~86K products, nightly)
- **Format**: Tilde-delimited (~), lines starting with DTL~
- **Env Vars**: `SYNNEX_SFTP_USER`, `SYNNEX_SFTP_PASS`

### SFTP - Stock Feed
- **Host**: sftp.us.tdsynnex.com:22
- **File**: 698913h.app (hourly refresh, stock-only)
- **Format**: Same tilde-delimited format as catalog
- **Env Vars**: Same as catalog feed

### Additional SFTP Files
- `vend_code_list.txt` — 1,657 vendor → numeric mfgCode mappings
- `category_list.txt` — Category hierarchy
- **Note**: SYNNEX mfgCodes are NUMERIC (e.g., 73779, 77294), not 3-letter abbreviations

---

## D&H Distributing

### REST API (Orders, Quotes, Price & Availability)
- **Portal**: https://www.dandh.com
- **Auth**: OAuth2 at `https://auth.dandh.com/api/oauth/token`
- **API Base**: `https://api.dandh.com/customerOrderManagement/v2`
- **Account**: 3254650000
- **Required Header**: `dandh-tenant: dhus` on ALL requests
- **Env Vars**: `DH_CLIENT_ID`, `DH_CLIENT_SECRET`, `DH_ACCOUNT`
- **Note**: API returning 404 as of March 2026 — account access issue to resolve

### FTP - Catalog Feed
- **Host**: ftp.dandh.com:21
- **Protocol**: Plain FTP (not SFTP)
- **Files**:
  - `ITEMLIST` — Full product catalog (~37K products, pipe-delimited, 19+ fields)
  - `CATEGORY` — Category code mapping (pipe-delimited: catCode|catName|subCode|subName)
  - `DISCOITEM` — Discontinued items
- **Env Vars**: `DH_FTP_USER`, `DH_FTP_PASS`

---

## Environment Variable Reference

```env
# Database
DATABASE_URL=postgresql://...

# Ingram Micro API
INGRAM_CLIENT_ID=
INGRAM_CLIENT_SECRET=
INGRAM_CUSTOMER_NUMBER=70-086662
INGRAM_SENDER_ID=A5IT-SonicWall-Store

# Ingram Micro SFTP
INGRAM_SFTP_HOST=mercury.ingrammicro.com
INGRAM_SFTP_PRICE_USER=
INGRAM_SFTP_PRICE_PASS=
INGRAM_SFTP_STOCK_USER=
INGRAM_SFTP_STOCK_PASS=

# TD SYNNEX SFTP
SYNNEX_SFTP_HOST=sftp.us.tdsynnex.com
SYNNEX_SFTP_USER=
SYNNEX_SFTP_PASS=

# TD SYNNEX EC Express
SYNNEX_EC_USERNAME=
SYNNEX_EC_PASSWORD=
SYNNEX_EC_ACCOUNT=698913

# D&H API
DH_CLIENT_ID=
DH_CLIENT_SECRET=
DH_ACCOUNT=3254650000

# D&H FTP
DH_FTP_HOST=ftp.dandh.com
DH_FTP_USER=
DH_FTP_PASS=

# Worker Config
SYNC_API_KEY=
TZ=America/New_York
HEALTH_PORT=8080
SYNC_BATCH_SIZE=500
SYNC_TMP_DIR=/tmp/sync-worker
```

---

## Credential Contacts

| Distributor | Contact | Email |
|---|---|---|
| Ingram Micro | API Support | api-support@ingrammicro.com |
| TD SYNNEX | Help Desk (FTP access) | helpdeskus@TDSYNNEX.com |
| TD SYNNEX | Customer # | 780980 (for FTP feed requests) |
| D&H | Account Manager | Contact via portal |

---

## Gotchas

- **D&H pageSize**: Only accepts 10 or 50 (25 returns 422)
- **D&H OAuth URL**: `auth.dandh.com` not `services.dandh.net`
- **Ingram vendorName filter**: Broken — use `keyword` parameter instead
- **Ingram pagination**: 25 items/page max, use `json.nextPage` field
- **Ingram IM-CorrelationID**: Must be <=32 chars (UUID without dashes)
- **SYNNEX SFTP**: Needs legacy SSH: `algorithms: { serverHostKey: ['ssh-rsa', 'ssh-dss'] }`
- **SYNNEX FTP creds**: SEPARATE from ECExpress — must request from account manager
- **BigInt prices**: Price columns are BigInt (cents) — handles items up to $21.4M+
