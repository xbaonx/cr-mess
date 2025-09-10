import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokensMap, getChainId } from '@/lib/server/oneinch';
import { getBinancePrices } from '@/lib/server/external';

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
    const map = await getTokensMap(chainId);
    const all: ApiToken[] = Object.values(map || {}).map((t: any) => ({
      symbol: String(t.symbol || ''),
      name: String(t.name || ''),
      address: String(t.address || ''),
      decimals: Number(t.decimals || 18),
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
    // Enrich with prices from Binance (best-effort)
    try {
      const symbols = Array.from(new Set(limited.map((t) => t.symbol.toUpperCase())));
      const priceMap = await getBinancePrices(symbols);
      for (const t of limited) {
        const key = t.symbol.toUpperCase();
        (t as any).priceUsd = priceMap[key] ?? 0;
      }
    } catch {}

    return res.status(200).json({ tokens: limited });
  } catch (err: any) {
    console.error('tokens list error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
