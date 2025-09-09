import type { NextApiRequest, NextApiResponse } from 'next';
import { readWallet, writeWallet } from '@/lib/server/storage';
import { decryptMnemonicServer, encryptMnemonicServer } from '@/lib/server/crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const { userId, oldPin, newPin } = req.body || {};
    if (!userId || !oldPin || !newPin) return res.status(400).json({ message: 'Missing fields' });

    const w = await readWallet(userId);
    if (!w) return res.status(404).json({ message: 'Wallet not found' });

    // Verify old PIN by decrypting
    let phrase: string;
    try {
      phrase = await decryptMnemonicServer(w.encryptedMnemonic, oldPin);
    } catch {
      return res.status(400).json({ message: 'Old PIN incorrect' });
    }

    const newEncrypted = await encryptMnemonicServer(phrase, newPin);
    const updated = { ...w, encryptedMnemonic: newEncrypted, updatedAt: new Date().toISOString() };
    await writeWallet(userId, updated);

    return res.status(200).json({ message: 'ok' });
  } catch (err: any) {
    console.error('change-pin error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
