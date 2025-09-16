import axios from 'axios';
import type { SimpleToken } from '@/lib/server/tokenStore';

const BINANCE_API = process.env.BINANCE_API_BASE_URL || 'https://api.binance.com';

/**
 * Fetch base assets that trade against USDT on Binance Spot markets.
 * Returns unique base symbols for pairs with status TRADING.
 */
export async function getBinanceUSDTBaseAssets(): Promise<string[]> {
  const url = `${BINANCE_API}/api/v3/exchangeInfo?permissions=SPOT`;
  const { data } = await axios.get(url, { timeout: 10000 });
  const symbols = Array.isArray(data?.symbols) ? data.symbols : [];
  const set = new Set<string>();
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
  return Array.from(set);
}

/**
 * Build SimpleToken list based on Binance symbols.
 * Address is a pseudo-address namespace 'BINANCE:<SYMBOL>' as placeholder.
 */
export async function buildBinanceTokenCatalog(): Promise<SimpleToken[]> {
  const bases = await getBinanceUSDTBaseAssets();
  const list: SimpleToken[] = bases.map((sym) => ({
    symbol: sym,
    name: sym,
    address: `BINANCE:${sym}`,
    decimals: 18, // unknown on-chain decimals; not used for Markets
    logoURI: undefined,
  }));
  return list;
}
