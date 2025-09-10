import type { NextApiRequest, NextApiResponse } from 'next';
import { readWallet } from '@/lib/server/storage';
import { decryptMnemonicServer } from '@/lib/server/crypto';
import { Wallet, ethers } from 'ethers';
import {
  resolveTokenBySymbol,
  NATIVE_TOKEN_ADDRESS,
  toWei,
  getAllowance,
  getApproveSpender,
  buildApproveTx,
  buildSwapTx,
  lt,
  getChainId,
  getQuote as oneInchQuote,
} from '@/lib/server/oneinch';
import { addReferralCredit, getRefWalletByCode } from '@/lib/server/referral';

function randomHex(len = 64) {
  const chars = 'abcdef0123456789';
  let out = '0x';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    const { userId, fromToken, toToken, amount, pin, infiniteApproval, refCode } = req.body || {};
    if (!userId || !fromToken || !toToken || !amount || !pin) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Validate amount: must be a positive number
    const amt = parseFloat(String(amount));
    if (!isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const w = await readWallet(userId);
    if (!w) return res.status(404).json({ message: 'Wallet not found' });

    // Check if we have the required env to perform a real swap
    const has1inch = !!process.env.ONEINCH_API_KEY;
    const rpcUrl = process.env.RPC_PROVIDER_URL;

    if (!has1inch || !rpcUrl) {
      // Validate PIN by attempting to decrypt (no mnemonic usage needed here)
      try {
        await decryptMnemonicServer(w.encryptedMnemonic, pin);
      } catch {
        return res.status(400).json({ message: 'Invalid PIN' });
      }
      // Stub: return mock tx hash if env not ready
      return res.status(200).json({ txHash: randomHex(64) });
    }

    // Real swap path via 1inch
    // 1) Decrypt mnemonic to get wallet
    let phrase: string;
    try {
      phrase = await decryptMnemonicServer(w.encryptedMnemonic, pin);
    } catch {
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = Wallet.fromPhrase(phrase).connect(provider);
    const fromAddr = await signer.getAddress();

    // 2) Resolve tokens
    const chainId = getChainId();
    const src = await resolveTokenBySymbol(String(fromToken), chainId);
    const dst = await resolveTokenBySymbol(String(toToken), chainId);
    if (!src || !dst) {
      return res.status(400).json({ message: 'Unsupported token symbol' });
    }

    const amountWei = toWei(String(amount), src.decimals);

    // 3) Approve if needed (ERC20 only)
    if (src.address !== NATIVE_TOKEN_ADDRESS) {
      const allowance = await getAllowance(src.address, fromAddr, chainId);
      if (lt(allowance, amountWei)) {
        const spender = await getApproveSpender(chainId);
        const approveTx = await buildApproveTx(src.address, infiniteApproval ? undefined : amountWei, chainId);
        // Send approve
        const approveResp = await signer.sendTransaction({
          to: approveTx.to,
          data: approveTx.data,
          value: approveTx.value ? BigInt(approveTx.value) : undefined,
        });
        await approveResp.wait();
      }
    }

    // Precompute integrator fee for referral credit (Plan A off-chain)
    let userCreditWei: string | null = null;
    try {
      const [qWithFee, qNoFee] = await Promise.all([
        oneInchQuote({ srcToken: src.address, dstToken: dst.address, amountWei, chainId }),
        oneInchQuote({ srcToken: src.address, dstToken: dst.address, amountWei, chainId, feeBpsOverride: 0, referrerOverride: '' }),
      ]);
      const withFee = BigInt(String(qWithFee?.dstAmount ?? '0'));
      const noFee = BigInt(String(qNoFee?.dstAmount ?? '0'));
      const integFee = noFee > withFee ? (noFee - withFee) : 0n;
      if (integFee > 0n) {
        const share = (integFee * 30n) / 100n; // 30%
        if (share > 0n) userCreditWei = share.toString();
      }
    } catch {}

    // 4) Build swap tx and send
    const swapData = await buildSwapTx({
      srcToken: src.address,
      dstToken: dst.address,
      amountWei,
      fromAddress: fromAddr,
      slippage: 1, // 1%
      chainId,
    });

    const tx = swapData?.tx || swapData;
    if (!tx?.to || !tx?.data) {
      return res.status(400).json({ message: 'Failed to build swap transaction' });
    }

    const sent = await signer.sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value ? BigInt(tx.value) : undefined,
      // gas / gasPrice are optional; provider can estimate
    });
    // Record referral credit if applicable (after successful send)
    try {
      const refWallet = getRefWalletByCode(refCode);
      if (refWallet && userCreditWei) {
        addReferralCredit(refWallet, chainId, dst.address, userCreditWei);
      }
    } catch {}
    return res.status(200).json({ txHash: sent.hash });
  } catch (err: any) {
    console.error('swap/request error', err);
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
