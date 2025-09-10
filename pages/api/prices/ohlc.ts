import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getUsdPrices } from '@/lib/server/external';

const BINANCE_API = process.env.BINANCE_API_BASE_URL || 'https://api.binance.com';

// Map wrapped or alias symbols to canonical Binance symbols
const aliasMap: Record<string, string> = {
  WBNB: 'BNB',
  WETH: 'ETH',
  WBTC: 'BTC',
  BTCB: 'BTC',
  WMATIC: 'MATIC',
  WAVAX: 'AVAX',
  WFTM: 'FTM',
  WBETH: 'ETH',
};

function toCanonical(sym: string) {
  const s = sym.toUpperCase();
  return aliasMap[s] || (s.startsWith('W') && s.length > 3 ? s.slice(1) : s);
}

const STABLES = new Set(['USDT', 'USDC', 'BUSD', 'DAI']);

function intervalToMs(interval: string): number {
  const m = interval.match(/^(\d+)([mhdw])$/);
  if (!m) return 60 * 60 * 1000; // default 1h
  const n = parseInt(m[1], 10);
  const u = m[2];
  switch (u) {
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    case 'w': return n * 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function makeSyntheticStableCandles(limit: number, interval: string, price = 1): Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> {
  const ms = intervalToMs(interval);
  const now = Date.now();
  const arr: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> = [];
  for (let i = limit - 1; i >= 0; i--) {
    const t = now - i * ms;
    arr.push({ t, o: price, h: price, l: price, c: price, v: 0 });
  }
  return arr;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const rawSymbol = String(req.query.symbol || '').trim();
    const interval = String(req.query.interval || '1h');
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '60')) || 60, 10), 500);
    if (!rawSymbol) return res.status(400).json({ message: 'Missing symbol' });

    const canonical = toCanonical(rawSymbol);
    const rawUpper = rawSymbol.toUpperCase();
    // Special-case stables: return synthetic flat candles @ $1
    if (STABLES.has(canonical)) {
      const candles = makeSyntheticStableCandles(limit, interval, 1);
      return res.status(200).json({ candles });
    }

    const pair = `${canonical}USDT`;
    const url = `${BINANCE_API}/api/v3/klines`;
    try {
      const { data } = await axios.get(url, { params: { symbol: pair, interval, limit }, timeout: 10000 });
      if (!Array.isArray(data)) {
        // fallback to synthetic using current price (try canonical and original symbol)
        const prices = await getUsdPrices([canonical, rawUpper]);
        const price = prices[canonical] || prices[rawUpper] || 0;
        const candles = price > 0 ? makeSyntheticStableCandles(limit, interval, price) : [];
        return res.status(200).json({ candles });
      }
      // Binance klines format per item:
      // [ openTime, open, high, low, close, volume, closeTime, ... ]
      const candles = data.map((k: any[]) => ({
        t: Number(k[0]) || 0,
        o: parseFloat(k[1]) || 0,
        h: parseFloat(k[2]) || 0,
        l: parseFloat(k[3]) || 0,
        c: parseFloat(k[4]) || 0,
        v: parseFloat(k[5]) || 0,
      }));
      return res.status(200).json({ candles });
    } catch (e) {
      // If Binance doesn't have this pair, synthesize using current price if available
      try {
        const prices = await getUsdPrices([canonical, rawUpper]);
        const price = prices[canonical] || prices[rawUpper] || 0;
        const candles = price > 0 ? makeSyntheticStableCandles(limit, interval, price) : [];
        return res.status(200).json({ candles });
      } catch {
        return res.status(200).json({ candles: [] });
      }
    }
  } catch (err: any) {
    console.error('ohlc error', err?.message || err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error', candles: [] });
  }
}
