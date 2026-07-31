# Maatram Portal Backend — Production Deployment Guide

This document describes the steps required to deploy the Maatram Portal Backend to a production environment **without Docker**. The application is a standard Node.js process managed by PM2.

---

## 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | v20 LTS+ | Required for runtime |
| **npm** | v10+ | Bundled with Node.js |
| **PM2** | Latest | Global process manager |
| **PostgreSQL** | v15+ | Supabase or any hosted instance |

> No Redis installation is required. The application uses only PostgreSQL and Cloudinary.

---

## 2. Environment Configuration

Create a `.env` file in the root of the `server/` directory and populate all values:

```ini
# Server
PORT=5000
NODE_ENV=production
API_VERSION=v1
FRONTEND_URL=https://maatram-portal.org

# Database (Supabase)
# Transaction Pooler URL (used at runtime)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
# Direct URL (used for Prisma migrations only)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# JWT (generate with: openssl rand -hex 64)
JWT_ACCESS_SECRET=your_strong_access_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP (Mock logger used if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=no-reply@maatram.org
SMTP_PASS=your_smtp_app_password
SMTP_FROM_EMAIL=no-reply@maatram.org
SMTP_FROM_NAME="Maatram Foundation"
```

---

## 3. Deployment Steps

### Step 1 — Install Dependencies
```bash
npm ci --omit=dev
```

### Step 2 — Apply Database Migrations
```bash
npx prisma migrate deploy
```
This applies all pending schema migrations safely without data loss.

### Step 3 — Seed the Database
Run once on first deployment to create the default admin account and static lookup data:
```bash
npm run prisma:seed
```
| Credential | Value |
|---|---|
| Default Admin Email | `admin@maatram.org` |
| Default Admin Password | `AdminPassword@123` |

> **Important**: Change this password immediately after first login.

### Step 4 — Build TypeScript
```bash
npm run build
```
Compiled output is placed in `/dist`.

### Step 5 — Start with PM2
```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the application cluster
pm2 start dist/index.js --name "maatram-backend" -i max

# Enable auto-restart on server reboot
pm2 startup
pm2 save

# Verify status
pm2 list
pm2 logs maatram-backend
```

---

## 4. Health Check Verification

After deployment, verify the following endpoints respond correctly:

| Endpoint | Expected Status | Description |
|---|---|---|
| `GET /health` | `200 OK` | Server uptime |
| `GET /health/database` | `200 OK` | PostgreSQL connectivity |

---

## 5. Production Security Hardening

1. **Reverse Proxy (Nginx)**: Terminate SSL/TLS at Nginx. Forward requests to port 5000 only. Set `app.set('trust proxy', 1)` in Express for correct IP resolution behind proxy.
2. **Database SSL**: Use `sslmode=require` in the `DATABASE_URL` connection string.
3. **CORS**: Set `FRONTEND_URL` strictly to your production domain.
4. **Strong Secrets**: Generate JWT secrets with `openssl rand -hex 64`. Never reuse development secrets in production.
5. **Log Monitoring**: Winston writes structured logs to stdout. Pipe PM2 logs to a log aggregation service (e.g., Datadog, CloudWatch, or Papertrail).
6. **Rate Limiting**: The global `/api/*` rate limiter (100 req/15 min) is active by default. Adjust `windowMs` and `limit` in `app.ts` for your traffic patterns.

---

## 6. Rolling Updates

```bash
# Pull new code
git pull origin main

# Install any new dependencies
npm ci --omit=dev

# Apply any new migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Zero-downtime reload
pm2 reload maatram-backend
```
