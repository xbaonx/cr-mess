import type { NextApiRequest, NextApiResponse } from 'next';
import { getUsdPrices } from '@/lib/server/external';

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

    const prices = await getUsdPrices(symbols);
    return res.status(200).json({ prices });
  } catch (err: any) {
    console.error('prices error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
