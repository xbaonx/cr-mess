import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const rawSymbol = String(req.query.symbol || '').trim();
    const interval = String(req.query.interval || '1h');
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '60')) || 60, 10), 500);
    if (!rawSymbol) return res.status(400).json({ message: 'Missing symbol' });

    const canonical = toCanonical(rawSymbol);
    const pair = `${canonical}USDT`;
    const url = `${BINANCE_API}/api/v3/klines`;
    const { data } = await axios.get(url, { params: { symbol: pair, interval, limit }, timeout: 10000 });

    if (!Array.isArray(data)) return res.status(200).json({ candles: [] });
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
  } catch (err: any) {
    console.error('ohlc error', err?.message || err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error', candles: [] });
  }
}
