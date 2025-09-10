import { promises as fs } from 'fs';
import path from 'path';
import { ethers } from 'ethers';

export type ReferralLedger = Record<string, Record<number, Record<string, string>>>;
// wallet -> chainId -> tokenAddress(lowercase) -> wei string total

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

async function getReferralDir(): Promise<string> {
  const root = await resolveDataRoot();
  const dir = path.join(root, 'referrals');
  await ensureDir(dir);
  return dir;
}

async function getLedgerPath(): Promise<string> {
  const dir = await getReferralDir();
  return path.join(dir, 'ledger.json');
}

export async function readLedger(): Promise<ReferralLedger> {
  const p = await getLedgerPath();
  try {
    const raw = await fs.readFile(p, 'utf8');
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') return obj as ReferralLedger;
  } catch {}
  return {};
}

export async function writeLedger(ledger: ReferralLedger): Promise<void> {
  const p = await getLedgerPath();
  const tmp = p + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(ledger, null, 2), 'utf8');
  await fs.rename(tmp, p);
}

export async function addCredit(refWallet: string, chainId: number, tokenAddress: string, amountWei: string): Promise<void> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(refWallet)) return;
  const amt = (()=>{ try { return ethers.toBigInt(amountWei); } catch { return 0n; }})();
  if (amt <= 0n) return;
  const lower = tokenAddress.toLowerCase();
  const ledger = await readLedger();
  if (!ledger[refWallet]) ledger[refWallet] = {} as any;
  if (!ledger[refWallet][chainId]) ledger[refWallet][chainId] = {} as any;
  const prev = ledger[refWallet][chainId][lower] ? (()=>{ try { return ethers.toBigInt(ledger[refWallet][chainId][lower]); } catch { return 0n; }})() : 0n;
  const next = prev + amt;
  ledger[refWallet][chainId][lower] = next.toString();
  await writeLedger(ledger);
}
