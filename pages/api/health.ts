import type { NextApiRequest, NextApiResponse } from 'next';
import { listWalletUids } from '@/lib/server/storage';
import { readTokenCatalog, getCatalogUpdatedTime } from '@/lib/server/tokenStore';
import { readFeatures } from '@/lib/server/featuresStore';
import { getChainId } from '@/lib/server/oneinch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    const [uids, catalog, catalogMTime, features] = await Promise.all([
      listWalletUids({ limit: 100000 }),
      readTokenCatalog(getChainId()),
      getCatalogUpdatedTime(getChainId()),
      readFeatures().catch(() => ({} as any)),
    ]);

    const mem = process.memoryUsage();
    const health = {
      time: new Date().toISOString(),
      node: process.version,
      env: process.env.NODE_ENV || 'development',
      chainId: getChainId(),
      uptimeSec: Math.round(process.uptime()),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: (mem as any).external,
      },
      wallets: {
        count: uids.length,
      },
      tokens: {
        count: catalog?.tokens?.length || 0,
        updatedAt: catalog?.updatedAt || null,
        mtimeMs: catalogMTime || null,
      },
      features,
    };

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(health);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Internal Server Error' });
  }
}
