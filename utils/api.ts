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

export default api;
