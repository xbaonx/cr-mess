import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TokenInfo, WalletFile } from './types';
import { randomBytes } from 'crypto';

const DATA_DIR = process.env.DATA_DIR || '/mnt/data';
const WALLETS_DIR = path.join(DATA_DIR, 'wallets');

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function filePath(uid: string) {
  return path.join(WALLETS_DIR, `${uid}.json`);
}

@Injectable()
export class WalletService {
  async getWallet(uid: string): Promise<WalletFile | null> {
    try {
      const p = filePath(uid);
      const raw = await fs.readFile(p, 'utf8');
      return JSON.parse(raw) as WalletFile;
    } catch {
      return null;
    }
  }

  async saveCreated(payload: {
    userId: string;
    encryptedMnemonic: string;
    walletAddress: string;
    pin: string;
  }): Promise<WalletFile> {
    await ensureDir(WALLETS_DIR);
    const now = new Date().toISOString();
    const data: WalletFile = {
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      encryptedMnemonic: payload.encryptedMnemonic,
      pin: payload.pin,
      tokens: [],
      createdAt: now,
      updatedAt: now,
    };
    await fs.writeFile(filePath(payload.userId), JSON.stringify(data, null, 2));
    return data;
  }

  async importWallet(payload: {
    userId: string;
    encryptedMnemonic: string;
    walletAddress: string;
    pin: string;
  }): Promise<WalletFile> {
    const existing = await this.getWallet(payload.userId);
    const now = new Date().toISOString();
    const data: WalletFile = {
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      encryptedMnemonic: payload.encryptedMnemonic,
      pin: payload.pin,
      tokens: existing?.tokens ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await ensureDir(WALLETS_DIR);
    await fs.writeFile(filePath(payload.userId), JSON.stringify(data, null, 2));
    return data;
  }

  async changePin(payload: { userId: string; oldPin: string; newPin: string }): Promise<{ ok: true }> {
    const w = await this.getWallet(payload.userId);
    if (!w) throw new Error('WALLET_NOT_FOUND');
    if (w.pin !== payload.oldPin) throw new Error('INVALID_OLD_PIN');
    w.pin = payload.newPin;
    w.updatedAt = new Date().toISOString();
    await ensureDir(WALLETS_DIR);
    await fs.writeFile(filePath(payload.userId), JSON.stringify(w, null, 2));
    return { ok: true };
  }

  async getInfo(uid: string): Promise<{ userId: string; walletAddress: string; tokens: TokenInfo[]; totalUsd?: number }> {
    const w = await this.getWallet(uid);
    if (!w) throw new Error('WALLET_NOT_FOUND');
    const totalUsd = w.tokens?.reduce((acc, t) => acc + (Number(t.balance) * (t.priceUsd ?? 0)), 0);
    return {
      userId: w.userId,
      walletAddress: w.walletAddress,
      tokens: w.tokens ?? [],
      totalUsd: Number.isFinite(totalUsd) ? Number(totalUsd.toFixed(2)) : undefined,
    };
  }

  async swapRequest(payload: { userId: string; fromToken: string; toToken: string; amount: string; pin: string }): Promise<{ txHash: string }> {
    const w = await this.getWallet(payload.userId);
    if (!w) throw new Error('WALLET_NOT_FOUND');
    if (w.pin !== payload.pin) throw new Error('INVALID_PIN');
    // Demo only: just return a fake tx hash (no real on-chain action)
    const bytes = randomBytes(32);
    const txHash = '0x' + bytes.toString('hex');
    return { txHash };
  }
}
