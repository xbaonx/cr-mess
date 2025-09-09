# Crypto WebView (Next.js + TypeScript + Tailwind)

A mobile-friendly WebView for a crypto chatbot running inside Facebook Messenger (Chatfuel). The app talks to a Next.js API via REST and stores no data locally except in-memory; persistent data lives on the disk (e.g. `{DATA_DIR}/wallets/{uid}.json`).

- Framework: Next.js (Pages Router) + TypeScript
- Styling: TailwindCSS
- HTTP: axios (client-side only; no SSR)
- Crypto: ethers (v6) for wallet generation and validation

## Features

- Create wallet on the client with `ethers.Wallet.createRandom()` and encrypt mnemonic with a user PIN
- Import wallet from 12-word mnemonic and encrypt with a user PIN
- View wallet info (address, tokens, balances, USD value)
- Request a token swap by submitting form inputs
- Change wallet PIN
- Buy USDT by redirecting to MoonPay/Transak with wallet address

## URL and Identity

- User is uniquely identified via URL param: `?uid=fb_12345678`
- All pages expect `uid` in the query string. For local development you can manually append it.

## REST Endpoints (Next.js API)

- POST `/api/wallet/save-created` — save client-created wallet
- POST `/api/wallet/import` — import an existing wallet
- POST `/api/wallet/change-pin` — change PIN
- GET `/api/wallet/info?uid=...` — fetch wallet view data
- POST `/api/swap/request` — request swap

Note: The Chatfuel-only endpoint `POST /wallet/create` is not implemented in this Next.js API. It existed in the reference NestJS backend and is not required for the WebView flow here.

For this WebView, the endpoints are implemented via Next.js API Routes under `pages/api/*` and are exposed on the same domain under `/api/...`. No external base URL is required.

## Client-side Encryption Format

When creating or importing a wallet, the mnemonic is encrypted in the browser using Web Crypto (AES-256-GCM) with a key derived from the PIN using PBKDF2 (SHA-256, 100k iterations). The payload sent to the backend is a base64-encoded JSON object with:

```json
{
  "alg": "PBKDF2-AES-GCM",
  "kdf": "PBKDF2",
  "iterations": 100000,
  "hash": "SHA-256",
  "salt": "<base64>",
  "iv": "<base64>",
  "ciphertext": "<base64>"
}
```

The backend can verify or re-encrypt using the same scheme if needed. For this WebView flow, the PIN is also sent as plain text per specification to allow backend-side operations; you may harden this in production.

## Getting Started

1. Copy env file

```bash
cp .env.example .env
# Optionally set DATA_DIR to control where wallets are stored
```

2. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000?uid=fb_12345678

## Build and Start (Render)

- Build command: `npm install && npm run build`
- Start command: `npm start`

If you prefer Docker, a sample `Dockerfile` is included. Ensure Node.js 18+.

## Data storage

- Wallet files are stored under `{DATA_DIR}/wallets/{uid}.json`.
- `DATA_DIR` defaults to `/mnt/data` if available; otherwise falls back to `./data` inside the project during development.

## About `backend/`

- The `backend/` directory contains a compiled NestJS build (`dist/`) provided for reference. In the current setup, the Next.js API Routes inside `pages/api/` serve as the active backend for the WebView flow. You can keep `backend/` as documentation/reference or extract it into a separate service if you want a dedicated backend.

## Project Structure

```
pages/
  _app.tsx
  index.tsx
  create.tsx
  import.tsx
  dashboard.tsx
  swap.tsx
  set-pin.tsx
  buy-usdt.tsx
components/
  Notification.tsx
  PinInput.tsx
  TokenList.tsx
  SwapForm.tsx
utils/
  api.ts
  useUserId.ts
  crypto.ts
styles/
  globals.css
```

## Notes

- This app deliberately avoids SSR; all API calls run client-side.
- Designed to be embedded in Messenger WebView; UI is compact and mobile-first.
- Wallet storage path can be configured via `DATA_DIR`; default is `/mnt/data/wallets/{uid}.json` or `./data/wallets/{uid}.json` in development.
