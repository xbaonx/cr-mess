import type { NextApiRequest, NextApiResponse } from 'next';
import { readWallet, upsertWallet, deleteWallet } from '@/lib/server/storage';

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
    const uid = String(req.query.uid || '').trim();
    if (!uid) return res.status(400).json({ message: 'Missing uid' });
    assertAdmin(req);

    if (req.method === 'GET') {
      const rec = await readWallet(uid);
      if (!rec) return res.status(404).json({ message: 'Not found' });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(rec);
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const existing = await readWallet(uid);
      if (!existing) return res.status(404).json({ message: 'Not found' });
      const nextMeta = typeof body.metadata === 'object' && body.metadata ? { ...existing.metadata, ...body.metadata } : existing.metadata;
      const updated = await upsertWallet(uid, {
        userId: existing.userId,
        walletAddress: typeof body.walletAddress === 'string' ? body.walletAddress : existing.walletAddress,
        encryptedMnemonic: existing.encryptedMnemonic, // not editable via admin API
        tokens: existing.tokens,
        totalUsd: existing.totalUsd,
        metadata: nextMeta,
      });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const ok = await deleteWallet(uid);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (e: any) {
    const code = e?.statusCode || 500;
    return res.status(code).json({ message: e?.message || 'Internal Server Error' });
  }
}
