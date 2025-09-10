import { addCredit as storeAddCredit, readLedger } from '@/lib/server/referralStore';

// Simple in-memory referral registry and credit ledger (Plan A: off-chain split)
// Mapping source:
// - REF_CODE_MAP env var (JSON string): { "CODE123": "0xRefWallet...", ... }
// - If refCode looks like an EVM address, we accept it directly (optional UX).
// Ledger structure is persisted to disk via referralStore (JSON under DATA_DIR):
//   {
//     [refWallet: string]: {
//       [chainId: number]: {
//         [tokenAddress(lowercase): string]: string /* wei string total */
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

export async function addReferralCredit(refWallet: string, chainId: number, tokenAddress: string, amountWei: string): Promise<void> {
  await storeAddCredit(refWallet, chainId, tokenAddress, amountWei);
}

export async function getReferralLedger() {
  return await readLedger();
}
