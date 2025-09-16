import { promises as fs } from 'fs';
import path from 'path';

export type Features = {
  enableSwap: boolean;
  enableBuy: boolean;
  maintenanceMode: boolean;
  [key: string]: any;
};

const DEFAULTS: Features = {
  enableSwap: true,
  enableBuy: true,
  maintenanceMode: false,
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

async function getSettingsDir(): Promise<string> {
  const root = await resolveDataRoot();
  const dir = path.join(root, 'settings');
  await ensureDir(dir);
  return dir;
}

async function getFeaturesPath(): Promise<string> {
  const dir = await getSettingsDir();
  return path.join(dir, 'features.json');
}

export async function readFeatures(): Promise<Features> {
  const p = await getFeaturesPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    const obj = JSON.parse(raw);
    return { ...DEFAULTS, ...(obj || {}) } as Features;
  } catch {
    return { ...DEFAULTS };
  }
}

export async function writeFeatures(next: Partial<Features>): Promise<Features> {
  const current = await readFeatures();
  const merged: Features = { ...current, ...next };
  const p = await getFeaturesPath();
  const tmp = p + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(merged, null, 2), 'utf8');
  await fs.rename(tmp, p);
  return merged;
}
