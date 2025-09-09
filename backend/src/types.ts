export type TokenInfo = {
  symbol: string;
  name?: string;
  balance: string; // decimal string
  decimals?: number;
  priceUsd?: number;
  logoUrl?: string;
};

export type WalletFile = {
  userId: string;
  walletAddress: string;
  encryptedMnemonic: string; // base64 payload from frontend
  pin: string; // plaintext per current spec (can be hashed later)
  tokens: TokenInfo[];
  createdAt: string;
  updatedAt: string;
};
