# ⚡ CryptoAlert PWA

> Real-time crypto & stock price alert system with AI analysis, webhooks, and Neon PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-teal?logo=postgresql)](https://neon.tech)
[![Groq](https://img.shields.io/badge/Groq-AI-orange)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple)](https://web.dev/progressive-web-apps)

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| 📊 **Live Prices** | SSE streaming for 100+ crypto + major stocks |
| 🔔 **Smart Alerts** | Price above/below + % change triggers |
| 🤖 **Groq AI** | Market analysis on every alert trigger |
| 🔗 **Webhooks** | HMAC-signed delivery to any endpoint |
| 🗄️ **Neon DB** | Serverless PostgreSQL with price history |
| 📱 **PWA** | Install on mobile/desktop, works offline |
| ⏱️ **Cron Engine** | Auto runs every 60s on Vercel |
| 🔐 **Auth** | NextAuth v5 (GitHub + Google OAuth) |

---

## 🏗️ Architecture

```
Browser (PWA)
    │
    ├── SSE Stream (/api/prices/stream) ──→ CoinGecko / Alpha Vantage
    │
    ├── REST API
    │    ├── /api/alerts        CRUD alert configs
    │    ├── /api/webhooks      CRUD webhooks + test delivery
    │    ├── /api/ai            Groq AI analysis
    │    └── /api/cron/...      Alert engine (Vercel Cron)
    │
    └── Neon PostgreSQL (Prisma ORM)
         ├── users + sessions
         ├── alerts + trigger logs
         ├── webhooks + deliveries
         └── price snapshots (history)

Alert Engine (every 60s)
    1. Fetch prices for all active alert symbols
    2. Save to price_snapshots
    3. Check conditions per alert
    4. On trigger → Groq AI analysis
    5. Fire webhooks to all registered endpoints
    6. Log to alert_trigger_logs
```

---

## 🚀 Quick Start

```bash
npm install
cp .env.local .env.local  # fill in your keys
npx prisma db push
npm run dev
```

See **[setup.md](./setup.md)** for full key setup guide.

---

## 📡 Webhook Payload

```json
{
  "event": "ALERT_TRIGGERED",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "symbol": "BTC",
    "alertType": "PRICE_ABOVE",
    "threshold": 70000,
    "currentPrice": 70250.50,
    "aiAnalysis": "BTC breaking key resistance...",
    "triggeredAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Requests are signed with `X-Alert-Signature: hmac-sha256-hex`.

---

## 🧪 Test the Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/{id}/test \
  -H "Cookie: your-session-cookie"
```

---

## 📄 License

MIT
