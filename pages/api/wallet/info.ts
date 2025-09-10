import type { NextApiRequest, NextApiResponse } from 'next';
import { readWallet, writeWallet } from '@/lib/server/storage';
import { getMoralisBalances, getUsdPrices } from '@/lib/server/external';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const uid = String(req.query.uid || '');
    if (!uid) return res.status(400).json({ message: 'Missing uid' });

    const w = await readWallet(uid);
    if (!w) return res.status(404).json({ message: 'Wallet not found' });

    // Small helper to cap slow calls
    const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms);
        p.then((v) => { clearTimeout(timer); resolve(v); }).catch((e) => { clearTimeout(timer); reject(e); });
      });
    };

    // Try fetching live balances via Moralis if API key is configured, but cap at 5s
    let tokens = w.tokens || [];
    let totalUsd = 0;
    const hasMoralis = !!process.env.MORALIS_API_KEY;
    if (hasMoralis && w.walletAddress) {
      try {
        const liveTokens = await withTimeout(getMoralisBalances(w.walletAddress), 5000);
        if (Array.isArray(liveTokens) && liveTokens.length > 0) {
          tokens = liveTokens;
          totalUsd = tokens.reduce((sum, t) => sum + (parseFloat(t.balance || '0') * (t.priceUsd || 0)), 0);
          // Persist refreshed snapshot (best-effort)
          try {
            await writeWallet(uid, { ...w, tokens, totalUsd, updatedAt: new Date().toISOString() });
          } catch {}
        }
      } catch {
        // ignore live fetch errors, fallback to stored
      }
    }
    // Ensure priceUsd is populated even if Moralis isn't configured
    try {
      const symbols = Array.from(new Set((tokens || []).map((t) => String(t.symbol || '').toUpperCase()).filter(Boolean)));
      if (symbols.length > 0) {
        const priceMap = await getUsdPrices(symbols, { totalTimeoutMs: 3000, perCallTimeoutMs: 1200, maxFallback: 8 });
        tokens = tokens.map((t) => ({ ...t, priceUsd: priceMap[String(t.symbol || '').toUpperCase()] ?? t.priceUsd ?? 0 }));
      }
    } catch {}

    totalUsd = tokens.reduce((sum, t) => sum + (parseFloat(t.balance || '0') * (t.priceUsd || 0)), 0);

    return res.status(200).json({
      userId: w.userId,
      walletAddress: w.walletAddress,
      tokens,
      totalUsd,
    });
  } catch (err: any) {
    console.error('wallet/info error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
