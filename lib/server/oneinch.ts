import axios from 'axios';
import { ethers } from 'ethers';

const ONEINCH_BASE = process.env.ONEINCH_API_BASE_URL || 'https://api.1inch.dev';
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || '';

export type OneInchToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
};

export function getChainId(): number {
  const env = Number(process.env.CHAIN_ID || 56); // default BSC
  return Number.isFinite(env) && env > 0 ? env : 56;
}

function oneInchClient() {
  return axios.create({
    baseURL: ONEINCH_BASE,
    timeout: 20000,
    headers: {
      'Authorization': `Bearer ${ONEINCH_API_KEY}`,
      'X-API-KEY': ONEINCH_API_KEY,
      'accept': 'application/json',
    },
  });
}

export async function getTokensMap(chainId = getChainId()): Promise<Record<string, OneInchToken>> {
  // simple in-memory cache (5 minutes)
  const now = Date.now();
  if (!(globalThis as any).__oneinchTokensCache) {
    (globalThis as any).__oneinchTokensCache = {} as Record<number, { ts: number; data: Record<string, OneInchToken> }>;
  }
  const cache = (globalThis as any).__oneinchTokensCache as Record<number, { ts: number; data: Record<string, OneInchToken> }>;
  const entry = cache[chainId];
  if (entry && now - entry.ts < 5 * 60 * 1000) {
    return entry.data;
  }
  const c = oneInchClient();
  const { data } = await c.get(`/swap/v6.0/${chainId}/tokens`);
  const tokens = (data?.tokens ?? {}) as Record<string, OneInchToken>;
  cache[chainId] = { ts: now, data: tokens };
  return tokens;
}

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export async function resolveTokenBySymbol(symbol: string, chainId = getChainId()): Promise<OneInchToken | null> {
  const upper = symbol.toUpperCase();
  if (upper === 'BNB') {
    return { symbol: 'BNB', name: 'BNB', address: NATIVE_TOKEN_ADDRESS, decimals: 18 };
  }
  const map = await getTokensMap(chainId);
  const candidates = Object.values(map).filter((t: any) => String(t?.symbol || '').toUpperCase() === upper);
  if (candidates.length === 0) return null;
  // Prefer well-known stables first
  const priority = ['USDT', 'USDC', 'BUSD', 'WBNB'];
  candidates.sort((a, b) => (priority.indexOf(b.symbol.toUpperCase()) - priority.indexOf(a.symbol.toUpperCase())));
  return candidates[0];
}

export async function getApproveSpender(chainId = getChainId()): Promise<string> {
  const c = oneInchClient();
  const { data } = await c.get(`/swap/v6.0/${chainId}/approve/spender`);
  return data?.address;
}

export async function getAllowance(tokenAddress: string, walletAddress: string, chainId = getChainId()): Promise<string> {
  const c = oneInchClient();
  const { data } = await c.get(`/swap/v6.0/${chainId}/approve/allowance`, {
    params: { tokenAddress, walletAddress },
  });
  return String(data?.allowance ?? '0');
}

export async function buildApproveTx(tokenAddress: string, amountWei?: string, chainId = getChainId()) {
  const c = oneInchClient();
  const params: any = { tokenAddress };
  if (amountWei) params.amount = amountWei;
  const { data } = await c.get(`/swap/v6.0/${chainId}/approve/transaction`, { params });
  return data; // { to, data, value }
}

export async function buildSwapTx(opts: {
  srcToken: string;
  dstToken: string;
  amountWei: string;
  fromAddress: string;
  slippage: number; // in percent, e.g. 1 = 1%
  chainId?: number;
}) {
  const chainId = opts.chainId ?? getChainId();
  const c = oneInchClient();
  const params: any = {
    src: opts.srcToken,
    dst: opts.dstToken,
    amount: opts.amountWei,
    from: opts.fromAddress,
    slippage: opts.slippage,
    // allowPartialFill: false,
  };
  const { data } = await c.get(`/swap/v6.0/${chainId}/swap`, { params });
  return data; // { tx: { to, data, value, gas, gasPrice, ... }, ... }
}

export function toWei(amountDecimal: string, decimals: number): string {
  return ethers.parseUnits(amountDecimal, decimals).toString();
}

export function lt(a: string, b: string): boolean {
  try {
    return ethers.toBigInt(a) < ethers.toBigInt(b);
  } catch { return false; }
}

export async function getQuote(opts: { srcToken: string; dstToken: string; amountWei: string; chainId?: number }) {
  const chainId = opts.chainId ?? getChainId();
  const c = oneInchClient();
  const params: any = {
    src: opts.srcToken,
    dst: opts.dstToken,
    amount: opts.amountWei,
  };
  const { data } = await c.get(`/swap/v6.0/${chainId}/quote`, { params });
  return data; // contains dstAmount, protocols, estimatedGas, etc.
}
