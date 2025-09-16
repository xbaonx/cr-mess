import type { NextApiRequest, NextApiResponse } from 'next';
import { getBinance24hChanges } from '@/lib/server/external';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const raw = String(req.query.symbols || '').trim();
    if (!raw) return res.status(400).json({ message: 'Missing symbols' });
    const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (symbols.length === 0) return res.status(400).json({ message: 'No valid symbols' });

    const changes = await getBinance24hChanges(symbols);
    // Encourage CDN/proxy caching briefly
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ changes, ts: Date.now() });
  } catch (err: any) {
    console.error('price changes error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
