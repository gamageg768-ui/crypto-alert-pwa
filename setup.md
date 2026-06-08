# 🚀 CryptoAlert PWA — Setup Guide

Real-time crypto & stock price alert system with Neon DB, Groq AI, and Webhooks.

---

## 🏗️ Stack Overview

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Framework   | Next.js 14 (App Router, TypeScript)           |
| Auth        | NextAuth.js v5 (GitHub + Google OAuth)        |
| Database    | Neon Serverless PostgreSQL + Prisma ORM       |
| AI          | Groq API (llama3-70b-8192)                    |
| Crypto Data | CoinGecko API                                 |
| Stock Data  | Alpha Vantage API                             |
| Real-time   | Server-Sent Events (SSE)                      |
| Webhooks    | HMAC-SHA256 signed HTTP delivery              |
| PWA         | next-pwa + manifest + service worker          |
| Deploy      | Vercel (cron job included)                    |

---

## 1️⃣ Get Your API Keys

### Neon Database
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the **Connection string** → put in `.env.local` as `DATABASE_URL` and `DIRECT_DATABASE_URL`

### NextAuth Secret
```bash
openssl rand -base64 32
# Copy output → AUTH_SECRET in .env.local
```

### GitHub OAuth
1. GitHub → Settings → Developer settings → OAuth Apps → New
2. Homepage URL: `http://localhost:3000`
3. Callback: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID + Secret → `.env.local`

### Google OAuth
1. [console.cloud.google.com](https://console.cloud.google.com) → APIs → Credentials
2. Create OAuth 2.0 Client ID → Web app
3. Redirect: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID + Secret → `.env.local`

### Groq API Key
1. [console.groq.com](https://console.groq.com/keys)
2. Create API key → `GROQ_API_KEY` in `.env.local`

### CoinGecko (optional, for higher rate limits)
1. [coingecko.com/en/api](https://www.coingecko.com/en/api)
2. Free tier works without key; add key for higher limits

### Alpha Vantage (stocks)
1. [alphavantage.co](https://www.alphavantage.co/support/#api-key)
2. Free tier: 25 requests/day; sufficient for demo

---

## 2️⃣ Install & Setup

```bash
# Clone and install
cd crypto-alert-pwa
npm install

# Copy env template (fill in your keys)
cp .env.local .env.local.filled

# Generate Prisma client + push schema to Neon
npx prisma generate
npx prisma db push

# (Optional) seed & inspect data
npx prisma studio

# Run dev server
npm run dev
```

---

## 3️⃣ PWA Icons

Generate icons OR manually place images at:
- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)

```bash
# If you have canvas installed:
node scripts/generate-icons.js
```

---

## 4️⃣ Running the Alert Engine

The alert engine runs via the cron endpoint:
```
GET /api/cron/check-alerts
Authorization: Bearer YOUR_CRON_SECRET
```

**Locally:**
```bash
# Trigger manually in another terminal
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/check-alerts
```

**On Vercel:** `vercel.json` sets cron to run every 1 minute automatically.

---

## 5️⃣ Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod

# Set environment variables in Vercel Dashboard or:
vercel env add DATABASE_URL
vercel env add GROQ_API_KEY
# ... add all keys from .env.local
```

**Update OAuth redirect URLs** in GitHub/Google to your Vercel domain:
- `https://yourdomain.vercel.app/api/auth/callback/github`
- `https://yourdomain.vercel.app/api/auth/callback/google`

---

## 🏗️ Project Structure

```
crypto-alert-pwa/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── dashboard/page.tsx           # Main dashboard
│   ├── alerts/page.tsx              # Alert management
│   ├── webhooks/page.tsx            # Webhook management
│   ├── login/page.tsx               # OAuth login
│   └── api/
│       ├── auth/[...nextauth]/      # NextAuth handler
│       ├── prices/                  # Price REST + SSE stream
│       ├── alerts/                  # CRUD alerts
│       ├── webhooks/                # CRUD webhooks + test
│       ├── ai/                      # Groq AI endpoints
│       └── cron/check-alerts/       # Alert engine cron
├── components/
│   ├── Navbar.tsx                   # App navigation
│   ├── PriceTicker.tsx              # Live price grid (SSE)
│   ├── CreateAlertForm.tsx          # Alert creation + AI suggest
│   ├── AlertList.tsx                # Alert list + AI analysis
│   ├── WebhookManager.tsx           # Webhook CRUD + test
│   ├── StatsCards.tsx               # Dashboard stats
│   └── AIPortfolioInsight.tsx       # Groq portfolio analysis
├── lib/
│   ├── auth.ts                      # NextAuth config
│   ├── db.ts                        # Prisma + Neon client
│   ├── groq.ts                      # Groq AI functions
│   ├── prices.ts                    # CoinGecko + AlphaVantage
│   ├── webhooks.ts                  # Webhook delivery + signing
│   ├── alertEngine.ts               # Alert check logic
│   └── utils.ts                     # Helpers
├── prisma/schema.prisma             # Neon PostgreSQL schema
├── public/manifest.json             # PWA manifest
├── vercel.json                      # Cron config
└── middleware.ts                    # Auth middleware
```

---

## 🔗 Webhook Testing

Use [webhook.site](https://webhook.site) or [pipedream.com](https://pipedream.com) to test:
1. Get a free URL from webhook.site
2. Register it as a webhook in the app
3. Create an alert and trigger it (or use the Test button)
4. See the signed payload arrive

---

## 📊 Database Schema (Neon)

- **users** — NextAuth user accounts
- **alerts** — Price/% change alert configs per user
- **alert_trigger_logs** — History of triggers + Groq AI analysis
- **webhooks** — Registered webhook endpoints
- **webhook_deliveries** — Delivery log with status codes
- **price_snapshots** — Historical price data for each poll

---

## ⚡ Feature Highlights

| Feature | Implementation |
|---------|---------------|
| Live prices | SSE stream every 15-20s via `/api/prices/stream` |
| Price flash | DOM animation on price change (green=up, red=down) |
| Alert engine | Cron runs every minute, checks all active alerts |
| AI analysis | Groq llama3-70b triggered on every alert hit |
| AI threshold | "AI Suggest" button calls Groq for smart thresholds |
| Webhooks | HMAC-SHA256 signed, retried, logged |
| Auth | NextAuth v5 with Prisma adapter on Neon |
| PWA | Installable, offline-capable via next-pwa |
