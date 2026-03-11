# Deployment Guide — VAR E-Commerce Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Railway Project                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │    Admin      │  │  Storefront  │  │ Storefront │ │
│  │   Portal      │  │  SonicWall   │  │  Fortinet  │ │
│  │  :3001        │  │  :3000       │  │  :3000     │ │
│  │  admin.var.co │  │  sw-store.co │  │  ft-store  │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                │         │
│         └────────┬────────┴────────────────┘         │
│                  │                                    │
│         ┌───────┴────────┐                           │
│         │   PostgreSQL    │                           │
│         │  + PgBouncer    │                           │
│         │  (shared DB)    │                           │
│         └────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

## Railway Setup Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init
```

### 2. Add PostgreSQL

In the Railway dashboard:
1. Click "New Service" > "Database" > "PostgreSQL"
2. Railway auto-provisions with connection string
3. Copy the `DATABASE_URL` from the Variables tab

### 3. Deploy Admin Portal

```bash
# In Railway dashboard, create a new service from GitHub repo
# Set Root Directory: apps/admin
# Add environment variables:
DATABASE_URL=<from step 2>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://admin.yourdomain.com
NODE_ENV=production
```

### 4. Deploy Brand Storefronts

For each brand:
```bash
# Create a new service from the SAME GitHub repo
# Set Root Directory: apps/storefront
# Add environment variables:
DATABASE_URL=<from step 2>
BRAND_SLUG=sonicwall          # or fortinet, cisco, etc.
NEXT_PUBLIC_BRAND_SLUG=sonicwall
NODE_ENV=production
```

### 5. Custom Domains

In each service's Settings tab:
- Admin: `admin.yourdomain.com`
- SonicWall Store: `sonicwall-store.com`
- Fortinet Store: `fortinet-store.com`

## Environment Variables Reference

### Shared (All Services)
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | `production` or `development` | Yes |

### Admin Portal Only
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_SECRET` | Auth encryption key | Yes |
| `NEXTAUTH_URL` | Admin portal URL | Yes |
| `SMTP_HOST` | Email server host | No |
| `SMTP_PORT` | Email server port | No |
| `SMTP_USER` | Email username | No |
| `SMTP_PASS` | Email password | No |

### Storefront Only
| Variable | Description | Required |
|----------|-------------|----------|
| `BRAND_SLUG` | Brand identifier (e.g., `sonicwall`) | Yes |
| `NEXT_PUBLIC_BRAND_SLUG` | Client-side brand slug | Yes |
| `WORLDPAY_MERCHANT_ID` | Worldpay merchant ID | For payments |
| `WORLDPAY_API_KEY` | Worldpay API key | For payments |

## Adding a New Brand

1. **Database**: Insert a new `Brand` record via admin portal
2. **Railway**: Create new service from same repo
   - Root Directory: `apps/storefront`
   - Set `BRAND_SLUG` to the new brand's slug
   - Set `DATABASE_URL` to shared database
3. **Domain**: Add custom domain in Railway service settings
4. **Products**: Assign products to brand via admin portal
5. **Theme**: Configure brand colors/fonts via admin portal

## PgBouncer Configuration

For production, add PgBouncer as a Railway service:

1. Use the `edoburu/pgbouncer` Docker image
2. Set `DATABASE_URL` to point through PgBouncer
3. Configure pool mode: `transaction` (recommended for serverless)
4. Max connections: 100 (adjust based on service count)

```ini
# pgbouncer.ini
[databases]
var_ecommerce = host=<pg-host> port=5432 dbname=railway

[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
```

## Monorepo Build

Railway detects the monorepo structure via the Root Directory setting. Each service only builds its own app + shared packages.

Nixpacks handles the build automatically:
1. Installs root `node_modules` (workspaces)
2. Runs `turbo run build --filter=@var/<app-name>`
3. Starts with `npm start` in the app directory

## Health Checks

Each app exposes `GET /api/health`:
- Returns `200 OK` with `{ status: "ok", timestamp: "..." }`
- Railway uses this for deployment health checks
