import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { getChainId, resolveTokenBySymbol, toWei, getQuote as oneInchGetQuote } from '@/lib/server/oneinch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const fromToken = String(req.query.fromToken || '').trim();
    const toToken = String(req.query.toToken || '').trim();
    const amount = String(req.query.amount || '').trim();
    if (!fromToken || !toToken || !amount) return res.status(400).json({ message: 'Missing params' });

    const amt = parseFloat(amount);
    if (!isFinite(amt) || amt <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const chainId = getChainId();
    const src = await resolveTokenBySymbol(fromToken, chainId);
    const dst = await resolveTokenBySymbol(toToken, chainId);
    if (!src || !dst) return res.status(400).json({ message: 'Unsupported token symbol' });

    const amountWei = toWei(amount, src.decimals);
    const quote = await oneInchGetQuote({ srcToken: src.address, dstToken: dst.address, amountWei, chainId });

    const dstAmountWei = String(quote?.dstAmount || '0');
    const dstAmount = ethers.formatUnits(dstAmountWei, dst.decimals);

    return res.status(200).json({
      src: { symbol: src.symbol, address: src.address, decimals: src.decimals },
      dst: { symbol: dst.symbol, address: dst.address, decimals: dst.decimals },
      amount,
      amountWei,
      dstAmountWei,
      dstAmount,
      estimatedGas: quote?.estimatedGas,
    });
  } catch (err: any) {
    console.error('quote error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
