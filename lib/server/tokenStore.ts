import { promises as fs } from 'fs';
import path from 'path';

// Minimal shape we need to persist for tokens
export type SimpleToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
};

export type TokenCatalog = {
  tokens: SimpleToken[];
  updatedAt: string; // ISO string
  chainId?: number;
};

const DEFAULT_LOCAL_DIR = path.join(process.cwd(), 'data');

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

async function resolveDataRoot(): Promise<string> {
  const preferred = process.env.DATA_DIR || process.env.DATA_PATH || '/mnt/data';
  try {
    await ensureDir(preferred);
    const stat = await fs.stat(preferred);
    if (stat && stat.isDirectory()) return preferred;
  } catch {}
  await ensureDir(DEFAULT_LOCAL_DIR);
  return DEFAULT_LOCAL_DIR;
}

async function getTokensDir(): Promise<string> {
  const root = await resolveDataRoot();
  const dir = path.join(root, 'tokens');
  await ensureDir(dir);
  return dir;
}

async function getCatalogPath(chainId?: number): Promise<string> {
  const dir = await getTokensDir();
  const name = chainId ? `${chainId}-tokens.json` : 'tokens.json';
  return path.join(dir, name);
}

export async function readTokenCatalog(chainId?: number): Promise<TokenCatalog | null> {
  const p = await getCatalogPath(chainId);
  try {
    const raw = await fs.readFile(p, 'utf8');
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.tokens)) return obj as TokenCatalog;
  } catch {}
  return null;
}

export async function writeTokenCatalog(tokens: SimpleToken[], chainId?: number): Promise<void> {
  const p = await getCatalogPath(chainId);
  const tmp = p + '.tmp';
  const payload: TokenCatalog = { tokens, updatedAt: new Date().toISOString(), chainId };
  await fs.writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(tmp, p);
}

export async function getCatalogUpdatedTime(chainId?: number): Promise<number | null> {
  const p = await getCatalogPath(chainId);
  try {
    const stat = await fs.stat(p);
    return stat.mtimeMs || null;
  } catch { return null; }
}
