import type { NextApiRequest, NextApiResponse } from 'next';
import { readWallet } from '@/lib/server/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const uid = String(req.query.uid || '');
    if (!uid) return res.status(400).json({ message: 'Missing uid' });

    const w = await readWallet(uid);
    if (!w) return res.status(404).json({ message: 'Wallet not found' });

    const totalUsd = (w.tokens || []).reduce((sum, t) => {
      const bal = parseFloat(t.balance || '0');
      const price = typeof t.priceUsd === 'number' ? t.priceUsd : 0;
      return sum + bal * price;
    }, 0);

    return res.status(200).json({
      userId: w.userId,
      walletAddress: w.walletAddress,
      tokens: w.tokens || [],
      totalUsd,
    });
  } catch (err: any) {
    console.error('wallet/info error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
