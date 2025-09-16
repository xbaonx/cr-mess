import type { NextApiRequest, NextApiResponse } from 'next';
import { readFeatures } from '@/lib/server/featuresStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
    const features = await readFeatures();
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(features);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Internal Server Error' });
  }
}
