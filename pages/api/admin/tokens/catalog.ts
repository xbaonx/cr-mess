import type { NextApiRequest, NextApiResponse } from 'next';
import { getChainId } from '@/lib/server/oneinch';
import { readTokenCatalog } from '@/lib/server/tokenStore';

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
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
    assertAdmin(req);

    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '500')) || 500, 1), 5000);
    const chainId = getChainId();
    const catalog = await readTokenCatalog(chainId);
    const tokens = catalog?.tokens || [];
    const payload = tokens.slice(0, limit);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      chainId,
      updatedAt: catalog?.updatedAt || null,
      count: tokens.length,
      tokens: payload,
    });
  } catch (e: any) {
    const code = e?.statusCode || 500;
    return res.status(code).json({ message: e?.message || 'Internal Server Error' });
  }
}
