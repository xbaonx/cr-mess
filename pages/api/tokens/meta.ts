import type { NextApiRequest, NextApiResponse } from 'next';
import { getChainId } from '@/lib/server/oneinch';
import { readTokenCatalog } from '@/lib/server/tokenStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const adminToken = process.env.ADMIN_API_TOKEN || '';
    if (adminToken) {
      const hdr = String(req.headers['x-admin-token'] || '');
      if (hdr !== adminToken) return res.status(401).json({ message: 'Unauthorized' });
    }
    const chainIdEnv = getChainId();
    const cat = await readTokenCatalog(chainIdEnv);
    const count = cat?.tokens?.length || 0;
    const updatedAt = cat?.updatedAt || null;
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
    return res.status(200).json({ chainId: chainIdEnv, count, updatedAt });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
