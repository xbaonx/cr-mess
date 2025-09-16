import axios from 'axios';
import { CANONICAL_SYMBOL_OVERRIDES } from '@/lib/server/binanceWhitelist';
import type { TokenInfo } from '@/lib/server/storage';
import { getQuote as oneInchGetQuote, resolveTokenBySymbol, toWei, getChainId } from '@/lib/server/oneinch';

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

export async function getBinance24hChanges(symbols: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const result: Record<string, number> = {};
  // expand aliases like in price fetcher
  const aliasMap: Record<string, string> = {
    WBNB: 'BNB',
    WETH: 'ETH',
    WBTC: 'BTC',
    BTCB: 'BTC',
    WMATIC: 'MATIC',
    WAVAX: 'AVAX',
    WFTM: 'FTM',
    WBETH: 'ETH',
    ...CANONICAL_SYMBOL_OVERRIDES,
  };
  const expanded = new Set<string>();
  const originals: Record<string, Set<string>> = {};
  for (const s of unique) {
    expanded.add(s);
    const canonical = aliasMap[s] || (s.startsWith('W') && s.length > 3 ? s.slice(1) : s);
    if (canonical && canonical !== s) expanded.add(canonical);
    if (!originals[canonical]) originals[canonical] = new Set();
    originals[canonical].add(s);
  }
  const pairs = Array.from(expanded).map((s) => `${s}USDT`);
  const payload = encodeURIComponent(JSON.stringify(pairs));
  const url = `${BINANCE_API}/api/v3/ticker/24hr?symbols=${payload}`;
  try {
    const { data } = await axios.get(url, { timeout: 8000 });
    if (Array.isArray(data)) {
      for (const item of data) {
        const sym = String(item.symbol || '').replace(/USDT$/, '');
        const pct = parseFloat(String(item.priceChangePercent || '0'));
        if (isFinite(pct)) result[sym] = pct;
      }
      for (const [canonical, origSet] of Object.entries(originals)) {
        const pct = result[canonical];
        if (isFinite(pct)) {
          for (const orig of Array.from(origSet)) {
            result[orig] = pct;
          }
        }
      }
    }
  } catch {}
  return result;
}
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(timer); resolve(v); })
     .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

// Combined price fetcher: try Binance first, then fallback to 1inch quote for missing symbols
export async function getUsdPrices(symbols: string[], opts?: { maxFallback?: number; totalTimeoutMs?: number; perCallTimeoutMs?: number }): Promise<Record<string, number>> {
  const upper = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const primary = await getBinancePrices(upper);
  const result: Record<string, number> = { ...primary };
  const missing = upper.filter((s) => !(result[s] > 0));
  if (missing.length === 0) return result;
  const maxFallback = Math.max(0, opts?.maxFallback ?? 12);
  const totalTimeoutMs = Math.max(0, opts?.totalTimeoutMs ?? 8000);
  const perCallTimeoutMs = Math.max(500, opts?.perCallTimeoutMs ?? 3000);
  const start = Date.now();
  let used = 0;
  try {
    const chainId = getChainId();
    const usdt = await withTimeout(resolveTokenBySymbol('USDT', chainId), perCallTimeoutMs).catch(() => null as any);
    if (!usdt) return result;
    for (const sym of missing) {
      if (Date.now() - start > totalTimeoutMs) break;
      if (used >= maxFallback) break;
      if (stableUsd[sym] != null) { result[sym] = 1; continue; }
      try {
        const tok = await withTimeout(resolveTokenBySymbol(sym, chainId), perCallTimeoutMs).catch(() => null as any);
        if (!tok) continue;
        const amountWei = toWei('1', tok.decimals);
        const quote = await withTimeout(oneInchGetQuote({ srcToken: tok.address, dstToken: usdt.address, amountWei, chainId }), perCallTimeoutMs).catch(() => null as any);
        if (!quote) continue;
        const dstAmountWei = String((quote as any)?.dstAmount || '0');
        const price = parseFloat(formatUnitsFromWei(dstAmountWei, usdt.decimals));
        if (isFinite(price) && price > 0) {
          result[sym] = price;
          priceCache[sym] = { ts: Date.now(), price };
        }
        used += 1;
        await sleep(50);
      } catch {}
    }
  } catch {}
  return result;
}

// simple in-memory cache for prices with 60s TTL
type PriceCacheEntry = { ts: number; price: number };
const PRICE_TTL_MS = 60 * 1000;
if (!(globalThis as any).__priceCache) {
  (globalThis as any).__priceCache = {} as Record<string, PriceCacheEntry>;
}
const priceCache = (globalThis as any).__priceCache as Record<string, PriceCacheEntry>;

export async function getBinancePrices(symbols: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const map: Record<string, number> = {};
  const now = Date.now();
  const missing: string[] = [];
  // quick fill stables and cached
  for (const sym of unique) {
    if (stableUsd[sym] != null) {
      map[sym] = stableUsd[sym];
      continue;
    }
    const entry = priceCache[sym];
    if (entry && now - entry.ts < PRICE_TTL_MS) {
      map[sym] = entry.price;
    } else if (sym !== 'USD') {
      missing.push(sym);
    }
  }
  if (missing.length === 0) return map;
  try {
    // Binance multiple symbols endpoint expects JSON array as query param
    // Expand with alias symbols to improve hit rate (e.g., WBNB -> BNB, BTCB -> BTC)
    const aliasMap: Record<string, string> = {
      WBNB: 'BNB',
      WETH: 'ETH',
      WBTC: 'BTC',
      BTCB: 'BTC',
      WMATIC: 'MATIC',
      WAVAX: 'AVAX',
      WFTM: 'FTM',
      WBETH: 'ETH',
      ...CANONICAL_SYMBOL_OVERRIDES,
    };
    const expanded = new Set<string>();
    const originals: Record<string, Set<string>> = {};
    for (const s of missing) {
      expanded.add(s);
      const canonical = aliasMap[s] || (s.startsWith('W') && s.length > 3 ? s.slice(1) : s);
      if (canonical && canonical !== s) expanded.add(canonical);
      if (!originals[canonical]) originals[canonical] = new Set();
      originals[canonical].add(s);
    }
    const pairs = Array.from(expanded).map((s) => `${s}USDT`);
    const payload = encodeURIComponent(JSON.stringify(pairs));
    const url = `${BINANCE_API}/api/v3/ticker/price?symbols=${payload}`;
    const { data } = await axios.get(url, { timeout: 8000 });
    if (Array.isArray(data)) {
      for (const item of data) {
        const sym = String(item.symbol || '').replace(/USDT$/, '');
        const price = parseFloat(item.price);
        if (isFinite(price)) {
          map[sym] = price;
          priceCache[sym] = { ts: now, price };
        }
      }
      // propagate canonical prices back to original symbols (aliases)
      for (const [canonical, origSet] of Object.entries(originals)) {
        const price = map[canonical];
        if (isFinite(price)) {
          for (const orig of Array.from(origSet)) {
            map[orig] = price;
            priceCache[orig] = { ts: now, price };
          }
        }
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
