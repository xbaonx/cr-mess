import { promises as fs } from 'fs';
import path from 'path';

export type TokenInfo = {
  symbol: string;
  name?: string;
  balance: string;
  decimals?: number;
  priceUsd?: number;
  logoUrl?: string;
};

export type WalletRecord = {
  userId: string;
  walletAddress: string;
  encryptedMnemonic: string;
  tokens?: TokenInfo[];
  totalUsd?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
};

const DEFAULT_LOCAL_DIR = path.join(process.cwd(), 'data');

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

async function resolveDataRoot(): Promise<string> {
  const preferred = process.env.DATA_DIR || process.env.DATA_PATH || '/mnt/data';
  try {
    await ensureDir(preferred);
    const stat = await fs.stat(preferred);
    if (stat && stat.isDirectory()) return preferred;
  } catch {}
  // Fallback to local project data folder for dev
  await ensureDir(DEFAULT_LOCAL_DIR);
  return DEFAULT_LOCAL_DIR;
}

export async function getWalletsDir(): Promise<string> {
  const root = await resolveDataRoot();
  const wallets = path.join(root, 'wallets');
  await ensureDir(wallets);
  return wallets;
}

function walletPath(dir: string, uid: string): string {
  const safe = uid.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  return path.join(dir, `${safe}.json`);
}

export async function readWallet(uid: string): Promise<WalletRecord | null> {
  const dir = await getWalletsDir();
  const p = walletPath(dir, uid);
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as WalletRecord;
  } catch {
    return null;
  }
}

export async function writeWallet(uid: string, record: WalletRecord): Promise<void> {
  const dir = await getWalletsDir();
  const p = walletPath(dir, uid);
  await fs.writeFile(p, JSON.stringify(record, null, 2), 'utf8');
}

export async function upsertWallet(uid: string, update: Partial<WalletRecord> & { userId: string }): Promise<WalletRecord> {
  const existing = await readWallet(uid);
  const now = new Date().toISOString();
  const merged: WalletRecord = existing
    ? { ...existing, ...update, updatedAt: now }
    : {
        userId: update.userId,
        walletAddress: update.walletAddress || '',
        encryptedMnemonic: update.encryptedMnemonic || '',
        tokens: update.tokens || [],
        totalUsd: update.totalUsd || 0,
        createdAt: now,
        updatedAt: now,
        metadata: update.metadata || {},
      };
  await writeWallet(uid, merged);
  return merged;
}

export async function listWalletUids(params?: { limit?: number; q?: string }): Promise<string[]> {
  const dir = await getWalletsDir();
  try {
    const files = await fs.readdir(dir);
    let uids = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
    const q = (params?.q || '').trim().toLowerCase();
    if (q) {
      uids = uids.filter((u) => u.toLowerCase().includes(q));
    }
    const limit = Math.min(Math.max(params?.limit || 200, 1), 5000);
    return uids.slice(0, limit);
  } catch {
    return [];
  }
}

export async function deleteWallet(uid: string): Promise<boolean> {
  const dir = await getWalletsDir();
  const p = walletPath(dir, uid);
  try {
    await fs.unlink(p);
    return true;
  } catch {
    return false;
  }
}
