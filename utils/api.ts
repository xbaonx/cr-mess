import axios from 'axios';

export type TokenInfo = {
  symbol: string;
  name?: string;
  balance: string; // raw numeric as string for precision
  decimals?: number;
  priceUsd?: number;
  logoUrl?: string;
};

export type WalletInfoResponse = {
  userId: string;
  walletAddress: string;
  tokens: TokenInfo[];
  totalUsd?: number;
};

export type ApiToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  priceUsd?: number;
};

export type SaveCreatedPayload = {
  userId: string;
  encryptedMnemonic: string; // base64 JSON blob
  walletAddress: string;
  pin: string;
};

export type ImportPayload = SaveCreatedPayload;

export type ChangePinPayload = {
  userId: string;
  oldPin: string;
  newPin: string;
};

export type SwapRequestPayload = {
  userId: string;
  fromToken: string;
  toToken: string;
  amount: string; // decimal string
  pin: string;
  infiniteApproval?: boolean;
  refCode?: string;
};

export const api = axios.create({
  // No baseURL: we will call relative '/api/...' so it works on the same domain
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

export async function saveCreatedWallet(payload: SaveCreatedPayload) {
  const { data } = await api.post('/api/wallet/save-created', payload);
  return data;
}

export async function importWallet(payload: ImportPayload) {
  const { data } = await api.post('/api/wallet/import', payload);
  return data;
}

export async function changePin(payload: ChangePinPayload) {
  const { data } = await api.post('/api/wallet/change-pin', payload);
  return data;
}

export async function getWalletInfo(uid: string) {
  const { data } = await api.get<WalletInfoResponse>('/api/wallet/info', {
    params: { uid },
  });
  return data;
}

export async function swapRequest(payload: SwapRequestPayload) {
  const { data } = await api.post('/api/swap/request', payload);
  return data as { txHash?: string; error?: string };
}

export async function getTokens(params?: { q?: string; limit?: number }) {
  const { data } = await api.get('/api/tokens', { params });
  return (data?.tokens || []) as ApiToken[];
}

export async function getQuote(params: { fromToken: string; toToken: string; amount: string }) {
  const { data } = await api.get('/api/quote', { params });
  return data as {
    src: { symbol: string; address: string; decimals: number };
    dst: { symbol: string; address: string; decimals: number };
    amount: string; // decimal
    amountWei: string;
    dstAmountWei: string;
    dstAmount: string; // decimal
    estimatedGas?: string | number;
  };
}

export async function getPrices(symbols: string[]) {
  const { data } = await api.get('/api/prices', {
    params: { symbols: symbols.join(',') },
  });
  return (data?.prices || {}) as Record<string, number>;
}

export async function getPriceChanges(symbols: string[]) {
  const { data } = await api.get('/api/prices/changes', {
    params: { symbols: symbols.join(',') },
  });
  return {
    changes: (data?.changes || {}) as Record<string, number>,
    ts: (data?.ts as number) || Date.now(),
  };
}

export async function getOhlc(params: { symbol: string; interval?: string; limit?: number }) {
  const { data } = await api.get('/api/prices/ohlc', { params });
  return (data?.candles || []) as Array<{ t: number; o: number; h: number; l: number; c: number; v: number }>;
}

export default api;
