import axios from 'axios';
import type { TokenInfo } from '@/lib/server/storage';

const BINANCE_API = process.env.BINANCE_API_BASE_URL || 'https://api.binance.com';
const MORALIS_API = process.env.MORALIS_API_BASE_URL || 'https://deep-index.moralis.io/api/v2.2';
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || '';
// Moralis supports chain slugs such as: 'eth', 'bsc', 'polygon', 'arbitrum', ...
const MORALIS_CHAIN = process.env.MORALIS_CHAIN || 'bsc';

const stableUsd: Record<string, number> = {
  USDT: 1,
  USDC: 1,
  BUSD: 1,
  DAI: 1,
};

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function getBinancePrices(symbols: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const map: Record<string, number> = {};
  // quick fill stables
  for (const sym of unique) {
    if (stableUsd[sym] != null) map[sym] = stableUsd[sym];
  }
  const need = unique.filter((s) => map[s] == null && s !== 'USD');
  if (need.length === 0) return map;
  try {
    // Binance multiple symbols endpoint expects JSON array as query param
    const pairs = need.map((s) => `${s}USDT`);
    const payload = encodeURIComponent(JSON.stringify(pairs));
    const url = `${BINANCE_API}/api/v3/ticker/price?symbols=${payload}`;
    const { data } = await axios.get(url, { timeout: 15000 });
    if (Array.isArray(data)) {
      for (const item of data) {
        const sym = String(item.symbol || '').replace(/USDT$/, '');
        const price = parseFloat(item.price);
        if (isFinite(price)) map[sym] = price;
      }
    }
  } catch (e) {
    // ignore pricing errors; leave missing prices as 0
  }
  return map;
}

function formatUnitsFromWei(raw: string, decimals = 18): string {
  // Not precise for very large numbers but fine for display purposes in this MVP
  try {
    const n = parseFloat(raw);
    const denom = Math.pow(10, decimals);
    return (n / denom).toString();
  } catch {
    return '0';
  }
}

export async function getMoralisBalances(address: string): Promise<TokenInfo[]> {
  if (!MORALIS_API_KEY) {
    // Without API key, return empty tokens list (caller can fallback to stored tokens)
    return [];
  }
  const headers = { 'X-API-Key': MORALIS_API_KEY };
  try {
    // Native balance
    const nativeUrl = `${MORALIS_API}/${address}/balance?chain=${encodeURIComponent(MORALIS_CHAIN)}`;
    const nativeResp = await axios.get(nativeUrl, { headers, timeout: 15000 });
    const nativeBalanceWei = String(nativeResp.data?.balance ?? '0');

    const nativeSymbol = (() => {
      const map: Record<string, string> = { eth: 'ETH', bsc: 'BNB', polygon: 'MATIC', arbitrum: 'ETH' };
      const key = MORALIS_CHAIN.toLowerCase();
      return map[key] || 'ETH';
    })();

    const tokens: TokenInfo[] = [];
    tokens.push({ symbol: nativeSymbol, name: nativeSymbol, balance: formatUnitsFromWei(nativeBalanceWei, 18), decimals: 18 });

    // ERC20 balances
    const erc20Url = `${MORALIS_API}/${address}/erc20?chain=${encodeURIComponent(MORALIS_CHAIN)}`;
    const { data: erc20 } = await axios.get(erc20Url, { headers, timeout: 20000 });
    if (Array.isArray(erc20)) {
      for (const t of erc20) {
        const symbol = String(t.symbol || '').toUpperCase();
        const name = String(t.name || symbol);
        const decimals = Number(t.decimals || 18);
        const balance = formatUnitsFromWei(String(t.balance || '0'), decimals);
        tokens.push({ symbol, name, balance, decimals, logoUrl: t.logo });
      }
    }

    // Enrich with prices
    const priceMap = await getBinancePrices(tokens.map((t) => t.symbol));
    const withPrices = tokens.map((t) => ({ ...t, priceUsd: priceMap[t.symbol] ?? 0 }));
    return withPrices;
  } catch (e) {
    // In case of API errors, degrade gracefully
    return [];
  }
}
