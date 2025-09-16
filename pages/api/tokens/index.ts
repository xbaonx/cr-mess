import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokensMap, getChainId } from '@/lib/server/oneinch';
import { getBinancePrices } from '@/lib/server/external';
import { readTokenCatalog, writeTokenCatalog, type SimpleToken } from '@/lib/server/tokenStore';
import { buildBinanceTokenCatalog } from '@/lib/server/binanceTokens';

export type ApiToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  priceUsd?: number;
};

const PRIORITY = ['BNB', 'WBNB', 'USDT', 'USDC', 'BUSD', 'ETH', 'BTCB', 'MATIC'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '200')) || 200, 1), 1000);

    const chainId = getChainId();
    const qSource = String(req.query.source || '').toLowerCase();
    const source = (qSource || process.env.TOKEN_SOURCE || 'binance').toLowerCase();
    // In-memory cache by chainId
    const g = globalThis as any;
    if (!g.__tokenCatalog) g.__tokenCatalog = {};
    const TTL_MS = 6 * 60 * 60 * 1000; // 6h TTL
    let cached: { tokens: SimpleToken[]; ts: number } | undefined = g.__tokenCatalog[chainId];

    async function refreshCatalog(): Promise<SimpleToken[]> {
      let fresh: SimpleToken[] = [];
      if (source === 'oneinch') {
        const map = await getTokensMap(chainId);
        fresh = Object.values(map || {}).map((t: any) => ({
          symbol: String(t.symbol || ''),
          name: String(t.name || ''),
          address: String(t.address || ''),
          decimals: Number(t.decimals || 18),
          logoURI: t.logoURI,
        }));
      } else {
        // Default: Binance-based catalog (symbols that trade against USDT)
        fresh = await buildBinanceTokenCatalog();
      }
      await writeTokenCatalog(fresh, chainId);
      g.__tokenCatalog[chainId] = { tokens: fresh, ts: Date.now() };
      return fresh;
    }

    let base: SimpleToken[] | null = null;
    try {
      // Try in-memory, then file, else rebuild
      if (cached && Date.now() - cached.ts < TTL_MS) {
        const looksBinanceCached = cached.tokens.every((t: any) => String(t.address || '').startsWith('BINANCE:'));
        const expectBinanceCached = source !== 'oneinch';
        if ((expectBinanceCached && !looksBinanceCached) || (!expectBinanceCached && looksBinanceCached)) {
          base = await refreshCatalog();
        } else {
          base = cached.tokens;
        }
      } else {
        const file = await readTokenCatalog(chainId);
        if (file && Array.isArray(file.tokens) && file.tokens.length > 0) {
          const looksBinance = file.tokens.every((t: any) => String(t.address || '').startsWith('BINANCE:'));
          const expectBinance = source !== 'oneinch';
          // If mismatch (e.g., switched source), rebuild immediately and return fresh in this request
          if ((expectBinance && !looksBinance) || (!expectBinance && looksBinance)) {
            base = await refreshCatalog();
          } else {
            base = file.tokens;
            // refresh async if stale
            if (!cached || Date.now() - (cached?.ts || 0) >= TTL_MS) {
              refreshCatalog().catch(() => {});
            }
            // hydrate memory
            g.__tokenCatalog[chainId] = { tokens: base, ts: Date.now() };
          }
        } else {
          base = await refreshCatalog();
        }
      }
    } catch {
      // On any error, fallback to building fresh
      base = await refreshCatalog();
    }

    const all: ApiToken[] = (base || []).map((t) => ({
      symbol: t.symbol,
      name: t.name,
      address: t.address,
      decimals: t.decimals,
      logoURI: t.logoURI,
    }));

    let list = all;
    if (q) {
      list = all.filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const ia = PRIORITY.indexOf(a.symbol.toUpperCase());
      const ib = PRIORITY.indexOf(b.symbol.toUpperCase());
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      // fallback: alphabetical by symbol
      return a.symbol.localeCompare(b.symbol);
    });

    const limited = list.slice(0, limit);
    // Enrich with prices from Binance only
    try {
      const symbols = Array.from(new Set(limited.map((t) => t.symbol.toUpperCase())));
      const priceMap = await getBinancePrices(symbols);
      for (const t of limited) {
        const key = t.symbol.toUpperCase();
        (t as any).priceUsd = priceMap[key] ?? 0;
      }
    } catch {}

    // Shorten cache to reflect source switch quickly
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300');
    res.setHeader('X-Token-Source', source);
    return res.status(200).json({ tokens: limited });
  } catch (err: any) {
    console.error('tokens list error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
