import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import { readLedger, writeLedger } from '@/lib/server/referralStore';
import { getChainId, NATIVE_TOKEN_ADDRESS } from '@/lib/server/oneinch';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  try {
    // Auth guard
    const adminToken = process.env.ADMIN_API_TOKEN || '';
    if (adminToken) {
      const hdr = String(req.headers['x-admin-token'] || '');
      if (hdr !== adminToken) return res.status(401).json({ message: 'Unauthorized' });
    }

    const chainIdEnv = getChainId();
    const rpcUrl = process.env.RPC_PROVIDER_URL;
    const pk = process.env.ADMIN_PRIVATE_KEY || '';
    if (!rpcUrl || !pk) {
      return res.status(400).json({ message: 'Missing RPC_PROVIDER_URL or ADMIN_PRIVATE_KEY' });
    }

    const minPayoutWei = (() => {
      const v = String(process.env.MIN_PAYOUT_WEI ?? '0');
      try { return ethers.toBigInt(v); } catch { return 0n; }
    })();

    const body = req.body || {};
    const filterWallet = String(body.wallet || '').trim().toLowerCase();
    const filterToken = String(body.token || '').trim().toLowerCase();
    const dryRun = Boolean(body.dryRun);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(pk, provider);
    const adminAddr = (await signer.getAddress()).toLowerCase();

    const ledger = await readLedger();
    const actions: Array<{ wallet: string; token: string; amount: string } > = [];

    for (const wallet of Object.keys(ledger)) {
      if (filterWallet && wallet !== filterWallet) continue;
      const perChain = ledger[wallet] || {};
      const chainSlice = perChain[chainIdEnv] || {};
      for (const token of Object.keys(chainSlice)) {
        const amountStr = chainSlice[token] || '0';
        let amount: bigint;
        try { amount = ethers.toBigInt(amountStr); } catch { amount = 0n; }
        if (amount <= 0n) continue;
        if (amount < minPayoutWei) continue;
        if (filterToken && token !== filterToken) continue;
        actions.push({ wallet, token, amount: amount.toString() });
      }
    }

    if (dryRun) {
      return res.status(200).json({ admin: adminAddr, chainId: chainIdEnv, dryRun: true, actions });
    }

    const results: any[] = [];
    // Process sequentially to simplify state updates
    for (const act of actions) {
      const to = act.wallet;
      const token = act.token;
      const value = ethers.toBigInt(act.amount);
      try {
        let txHash = '';
        if (token === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
          const tx = await signer.sendTransaction({ to, value });
          txHash = tx.hash;
          await tx.wait();
        } else {
          const erc20 = new ethers.Contract(token, ERC20_ABI, signer);
          const tx = await erc20.transfer(to, value);
          txHash = tx.hash;
          await tx.wait();
        }
        // Zero out the paid credit
        if (ledger[to] && ledger[to][chainIdEnv] && ledger[to][chainIdEnv][token]) {
          ledger[to][chainIdEnv][token] = '0';
        }
        results.push({ ...act, txHash, status: 'ok' });
      } catch (e: any) {
        results.push({ ...act, error: e?.message || String(e), status: 'error' });
      }
    }

    // Persist updated ledger
    await writeLedger(ledger);

    return res.status(200).json({ admin: adminAddr, chainId: chainIdEnv, results });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
}
