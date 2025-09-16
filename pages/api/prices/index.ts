import type { NextApiRequest, NextApiResponse } from 'next';
import { getUsdPrices, getBinancePrices } from '@/lib/server/external';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const raw = String(req.query.symbols || '').trim();
    if (!raw) return res.status(400).json({ message: 'Missing symbols' });
    const symbols = raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (symbols.length === 0) return res.status(400).json({ message: 'No valid symbols' });

    const fast = String(req.query.fast || '0') === '1';
    const binanceOnly = String(req.query.binanceOnly || '0') === '1';
    const prices = binanceOnly
      ? await getBinancePrices(symbols)
      : await getUsdPrices(symbols, fast ? { totalTimeoutMs: 3000, perCallTimeoutMs: 1000, maxFallback: 8 } : undefined);
    // Encourage CDN/proxy caching for a short duration
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=30');
    return res.status(200).json({ prices });
  } catch (err: any) {
    console.error('prices error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
