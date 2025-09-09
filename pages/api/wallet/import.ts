import type { NextApiRequest, NextApiResponse } from 'next';
import { upsertWallet } from '@/lib/server/storage';
import { decryptMnemonicServer } from '@/lib/server/crypto';
import { Wallet } from 'ethers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const { userId, encryptedMnemonic, walletAddress, pin } = req.body || {};
    if (!userId || !encryptedMnemonic || !walletAddress || !pin) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Validate PIN + mnemonic, and optional address check
    let phrase: string;
    try {
      phrase = await decryptMnemonicServer(encryptedMnemonic, pin);
    } catch {
      return res.status(400).json({ message: 'Invalid PIN or encrypted payload' });
    }

    try {
      const w = Wallet.fromPhrase(phrase.trim().replace(/\s+/g, ' '));
      if (w.address.toLowerCase() !== String(walletAddress).toLowerCase()) {
        return res.status(400).json({ message: 'Wallet address does not match mnemonic' });
      }
    } catch {
      return res.status(400).json({ message: 'Invalid mnemonic' });
    }

    const saved = await upsertWallet(userId, {
      userId,
      walletAddress,
      encryptedMnemonic,
    });
    return res.status(200).json({ message: 'ok', userId: saved.userId, walletAddress: saved.walletAddress });
  } catch (err: any) {
    console.error('import error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
