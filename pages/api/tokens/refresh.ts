import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokensMap, getChainId } from '@/lib/server/oneinch';
import { writeTokenCatalog, type SimpleToken } from '@/lib/server/tokenStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const adminToken = process.env.ADMIN_API_TOKEN || '';
    if (adminToken) {
      const hdr = String(req.headers['x-admin-token'] || '');
      if (hdr !== adminToken) return res.status(401).json({ message: 'Unauthorized' });
    }

    const chainIdEnv = getChainId();
    const map = await getTokensMap(chainIdEnv);
    const fresh: SimpleToken[] = Object.values(map || {}).map((t: any) => ({
      symbol: String(t.symbol || ''),
      name: String(t.name || ''),
      address: String(t.address || ''),
      decimals: Number(t.decimals || 18),
      logoURI: t.logoURI,
    }));

    await writeTokenCatalog(fresh, chainIdEnv);
    // hydrate global cache as in /api/tokens
    try {
      const g = globalThis as any;
      if (!g.__tokenCatalog) g.__tokenCatalog = {};
      g.__tokenCatalog[chainIdEnv] = { tokens: fresh, ts: Date.now() };
    } catch {}

    return res.status(200).json({ chainId: chainIdEnv, count: fresh.length, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('tokens refresh error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
