# Chatfuel Integration Guide

This document explains how to open the web app (webview) from Chatfuel with the user's UID (Messenger/Instagram/Telegram), and leverage the built-in Create/Import wallet flow.

The app expects `uid` in the URL query string (see `utils/useUserId.ts`).

## Prerequisites
- Public web app base: `https://cr-mess.onrender.com`
- Make sure your Meta app (Messenger/Instagram) whitelists the domain:
  - Meta for Developers → Messenger → Settings → Whitelisted Domains → add `https://cr-mess.onrender.com`
  - Instagram uses the same whitelisting mechanism under Meta.

## Key URLs (append `?uid=...`)
- Dashboard: `https://cr-mess.onrender.com/dashboard?uid={{uid}}`
- Markets: `https://cr-mess.onrender.com/markets?uid={{uid}}`
- Buy USDT: `https://cr-mess.onrender.com/buy-usdt?uid={{uid}}`
- Token (buy): `https://cr-mess.onrender.com/token/WBNB?uid={{uid}}`
- Token (sell): `https://cr-mess.onrender.com/token/WBNB?mode=sell&uid={{uid}}`

Notes:
- `withUidPath()` in the frontend automatically preserves existing query params when appending `uid`.
- The app uses `RequireWallet` to show Create/Import when a UID has no saved wallet.

## What is `uid`?
`uid` is the unique identifier you pass from Chatfuel to the web app. Best practice is to use the platform user ID, e.g.:
- Messenger: `{{messenger user id}}`
- Instagram: `{{instagram user id}}`
- Telegram: `{{telegram user id}}` (or `{{chat id}}`, depending on setup)

To simplify, create a Chatfuel Attribute named `uid` and set it from the system attribute once (see below). Then use `{{uid}}` in all URLs.

## Step-by-step (Messenger/Instagram)
1. Create/ensure Attribute `uid` is set:
   - In a Block (e.g., Start), add action "Set Attribute" → `uid = {{messenger user id}}` (or `{{instagram user id}}`).
2. Add a button to open webview:
   - Add Button → "Open website".
   - URL: `https://cr-mess.onrender.com/dashboard?uid={{uid}}`.
   - Open in webview: Full/Tall.
3. (Optional) Add more entry points:
   - Markets: `https://cr-mess.onrender.com/markets?uid={{uid}}`
   - Buy USDT: `https://cr-mess.onrender.com/buy-usdt?uid={{uid}}`
   - Token buy: `https://cr-mess.onrender.com/token/WBNB?uid={{uid}}`
   - Token sell: `https://cr-mess.onrender.com/token/WBNB?mode=sell&uid={{uid}}`
4. (Optional) Persistent Menu:
   - Add "Open website" items with the URLs above.

## Telegram
- Use the same URLs with `?uid={{telegram user id}}` (or `{{chat id}}`).
- Telegram opens in external browser or in-app view depending on client.

## Dynamic token links
If you store the token symbol in a Chatfuel attribute (e.g., `{{token_symbol}}`), you can deep-link:
- Buy: `https://cr-mess.onrender.com/token/{{token_symbol}}?uid={{uid}}`
- Sell: `https://cr-mess.onrender.com/token/{{token_symbol}}?mode=sell&uid={{uid}}`

## Create/Import flow (no wallet yet)
- The web app checks wallet status for the given `uid` (`components/RequireWallet.tsx`).
- If no wallet is found, a Create/Import choice is shown automatically on Dashboard and Token swap sections.
- Create page: `/create?uid=...` → generates wallet with `ethers.Wallet.createRandom()` and stores an encrypted mnemonic.
- Import page: `/import?uid=...`.

## Testing checklist
- [ ] Your domain is whitelisted under Messenger settings.
- [ ] Button opens webview in Full/Tall mode.
- [ ] URL contains `?uid=...`.
- [ ] First open with new `uid` shows Create/Import.
- [ ] After creating/importing, Dashboard shows wallet address and assets.
- [ ] Clicking an asset opens the token page in sell mode (`?mode=sell`).

## Troubleshooting
- Missing UID warning:
  - Ensure links include `?uid={{uid}}` and that `uid` attribute is set from the platform system attribute.
- Webview doesn’t open:
  - Verify domain whitelisting and use HTTPS.
- Swap requires PIN:
  - Users must set PIN during create/import. PIN is required for signing operations.
- Fee error from 1inch ("fee must not be greater than 3"):
  - Already handled in `lib/server/oneinch.ts` (bps → percent, clamped to 3%).

## Security notes
- `uid` is used as an identifier for a user's wallet record on the server. Do not use sensitive PII as `uid`; platform user IDs are recommended.
- Never expose private keys; mnemonic is encrypted and stored server-side only with the user's PIN required for decrypting.
