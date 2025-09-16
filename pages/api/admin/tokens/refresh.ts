import type { NextApiRequest, NextApiResponse } from 'next';
import { getChainId, getTokensMap } from '@/lib/server/oneinch';
import { writeTokenCatalog, type SimpleToken } from '@/lib/server/tokenStore';

function assertAdmin(req: NextApiRequest) {
  const expected = process.env.ADMIN_API_TOKEN || '';
  const token = String(req.headers['x-admin-token'] || '');
  if (!expected || token !== expected) {
    const err: any = new Error('Unauthorized');
    (err.statusCode = 401);
    throw err;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    assertAdmin(req);

    const chainId = getChainId();
    const map = await getTokensMap(chainId);
    const fresh: SimpleToken[] = Object.values(map || {}).map((t: any) => ({
      symbol: String(t.symbol || ''),
      name: String(t.name || ''),
      address: String(t.address || ''),
      decimals: Number(t.decimals || 18),
      logoURI: t.logoURI,
    }));

    await writeTokenCatalog(fresh, chainId);

    const g = globalThis as any;
    if (!g.__tokenCatalog) g.__tokenCatalog = {};
    g.__tokenCatalog[chainId] = { tokens: fresh, ts: Date.now() };

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      chainId,
      updatedAt: new Date().toISOString(),
      count: fresh.length,
    });
  } catch (e: any) {
    const code = e?.statusCode || 500;
    return res.status(code).json({ message: e?.message || 'Internal Server Error' });
  }
}
