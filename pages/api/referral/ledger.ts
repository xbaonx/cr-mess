import type { NextApiRequest, NextApiResponse } from 'next';
import { getReferralLedger } from '@/lib/server/referral';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    // Simple debug/admin endpoint to view in-memory referral credits
    // Optionally filter by wallet address via ?wallet=0x...
    const wallet = String(req.query.wallet || '').trim().toLowerCase();
    const ledger = getReferralLedger();
    if (wallet && /^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      const slice = ledger[wallet] || {};
      return res.status(200).json({ wallet, credits: slice });
    }
    return res.status(200).json({ ledger });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
