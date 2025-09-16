import axios from 'axios';
import type { SimpleToken } from '@/lib/server/tokenStore';

const BINANCE_API = process.env.BINANCE_API_BASE_URL || 'https://api.binance.com';

const DEFAULT_BASES: string[] = [
  'USDT', 'USDC', 'BUSD', 'DAI',
  'BNB', 'BTC', 'ETH', 'MATIC', 'SOL', 'XRP', 'ADA', 'DOGE', 'LINK', 'CAKE'
];

/**
 * Fetch base assets that trade against USDT on Binance Spot markets.
 * Returns unique base symbols for pairs with status TRADING.
 */
export async function getBinanceUSDTBaseAssets(): Promise<string[]> {
  const set = new Set<string>();
  const tryFetch = async (url: string) => {
    const { data } = await axios.get(url, { timeout: 12000 });
    const symbols = Array.isArray(data?.symbols) ? data.symbols : [];
    for (const s of symbols) {
      try {
        if (!s) continue;
        const quote = String(s.quoteAsset || '').toUpperCase();
        const base = String(s.baseAsset || '').toUpperCase();
        const status = String(s.status || '');
        if (quote === 'USDT' && status === 'TRADING' && base) {
          set.add(base);
        }
      } catch {}
    }
  };
  try {
    // Try endpoint with 'permissions' filter first
    await tryFetch(`${BINANCE_API}/api/v3/exchangeInfo?permissions=SPOT`);
    if (set.size === 0) {
      // Fallback to full exchangeInfo
      await tryFetch(`${BINANCE_API}/api/v3/exchangeInfo`);
    }
  } catch (e) {
    // Final fallback: safe default bases (ensures API doesn't 500)
    DEFAULT_BASES.forEach((b) => set.add(b));
  }
  // Secondary fallback: if still too few, derive from /ticker/price list
  try {
    if (set.size < 20) {
      const { data } = await axios.get(`${BINANCE_API}/api/v3/ticker/price`, { timeout: 12000 });
      if (Array.isArray(data)) {
        for (const item of data) {
          const sym = String(item.symbol || '');
          if (sym.endsWith('USDT') && sym.length > 4) {
            const base = sym.slice(0, -4).toUpperCase();
            if (base) set.add(base);
          }
        }
      }
    }
  } catch {}
  // If still empty for any reason, return defaults
  if (set.size === 0) DEFAULT_BASES.forEach((b) => set.add(b));
  return Array.from(set);
}

/**
 * Build SimpleToken list based on Binance symbols.
 * Address is a pseudo-address namespace 'BINANCE:<SYMBOL>' as placeholder.
 */
export async function buildBinanceTokenCatalog(): Promise<SimpleToken[]> {
  try {
    const bases = await getBinanceUSDTBaseAssets();
    const list: SimpleToken[] = bases.map((sym) => ({
      symbol: sym,
      name: sym,
      address: `BINANCE:${sym}`,
      decimals: 18, // placeholder; not used for Markets
      logoURI: undefined,
    }));
    return list;
  } catch {
    // Absolute fallback to prevent API failures
    return DEFAULT_BASES.map((sym) => ({ symbol: sym, name: sym, address: `BINANCE:${sym}`, decimals: 18 }));
  }
}
