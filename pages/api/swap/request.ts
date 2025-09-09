import type { NextApiRequest, NextApiResponse } from 'next';
import { readWallet } from '@/lib/server/storage';
import { decryptMnemonicServer } from '@/lib/server/crypto';

function randomHex(len = 64) {
  const chars = 'abcdef0123456789';
  let out = '0x';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const { userId, fromToken, toToken, amount, pin } = req.body || {};
    if (!userId || !fromToken || !toToken || !amount || !pin) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const w = await readWallet(userId);
    if (!w) return res.status(404).json({ message: 'Wallet not found' });

    // Validate PIN by attempting to decrypt (no mnemonic usage needed here)
    try {
      await decryptMnemonicServer(w.encryptedMnemonic, pin);
    } catch {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    // Stub: return mock tx hash
    return res.status(200).json({ txHash: randomHex(64) });
  } catch (err: any) {
    console.error('swap/request error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
