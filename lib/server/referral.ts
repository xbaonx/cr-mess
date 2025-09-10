import { ethers } from 'ethers';

// Simple in-memory referral registry and credit ledger (Plan A: off-chain split)
// Mapping source:
// - REF_CODE_MAP env var (JSON string): { "CODE123": "0xRefWallet...", ... }
// - If refCode looks like an EVM address, we accept it directly (optional UX).
// Ledger structure (in-memory; replace with DB in production):
//   globalThis.__referralLedger = {
//     [refWallet: string]: {
//       [chainId: number]: {
//         [tokenAddress: string]: string /* wei string total */
//       }
//     }
//   }

function loadRefMap(): Record<string, string> {
  try {
    const raw = process.env.REF_CODE_MAP || '{}';
    const obj = JSON.parse(raw);
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

if (!(globalThis as any).__referralLedger) {
  (globalThis as any).__referralLedger = {} as Record<string, Record<number, Record<string, string>>>;
}

const ledger = (globalThis as any).__referralLedger as Record<string, Record<number, Record<string, string>>>;
const refMapCache = loadRefMap();

export function getRefWalletByCode(refCode?: string | null): string | null {
  if (!refCode) return null;
  const code = String(refCode).trim();
  if (!code) return null;
  // 1) from REF_CODE_MAP
  const fromMap = refMapCache[code];
  if (fromMap) return fromMap;
  // 2) accept raw address (optional)
  if (/^0x[0-9a-fA-F]{40}$/.test(code)) return code;
  return null;
}

export function addReferralCredit(refWallet: string, chainId: number, tokenAddress: string, amountWei: string) {
  try {
    if (!/^0x[0-9a-fA-F]{40}$/.test(refWallet)) return;
    const amt = ethers.toBigInt(amountWei);
    if (amt <= 0n) return;
    if (!ledger[refWallet]) ledger[refWallet] = {} as any;
    if (!ledger[refWallet][chainId]) ledger[refWallet][chainId] = {} as any;
    const key = tokenAddress.toLowerCase();
    const prev = ledger[refWallet][chainId][key] ? ethers.toBigInt(ledger[refWallet][chainId][key]) : 0n;
    const next = prev + amt;
    ledger[refWallet][chainId][key] = next.toString();
  } catch {}
}

export function getReferralLedger() {
  return ledger;
}
