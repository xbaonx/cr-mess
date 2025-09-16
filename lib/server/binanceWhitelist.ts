// Canonical symbol overrides to improve Binance hit-rate
// Key: incoming symbol (from 1inch or wallet), Value: canonical Binance base symbol
// Extend this map as needed for your chain and popular tokens.
export const CANONICAL_SYMBOL_OVERRIDES: Record<string, string> = {
  // Wrapped/bridged common
  WBNB: 'BNB',
  WETH: 'ETH',
  WBTC: 'BTC',
  BTCB: 'BTC',
  WMATIC: 'MATIC',
  WAVAX: 'AVAX',
  WFTM: 'FTM',
  WBETH: 'ETH',

  // Extras (examples, keep uppercase keys)
  CAKE: 'CAKE',
  DOGE: 'DOGE',
  SOL: 'SOL',
  ARB: 'ARB',
  OP: 'OP',
  SHIB: 'SHIB',
  LINK: 'LINK',
  ADA: 'ADA',
  XRP: 'XRP',
};
