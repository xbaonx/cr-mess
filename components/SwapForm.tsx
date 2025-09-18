import React, { useState } from 'react';
import PinInput from './PinInput';
import TokenPicker from './TokenPicker';
import { getQuote, getWalletInfo, TokenInfo } from '@utils/api';
import { useUserId } from '@utils/useUserId';

export type SwapValues = {
  fromToken: string;
  toToken: string;
  amount: string;
  pin: string;
  infiniteApproval?: boolean;
  refCode?: string;
};

type Props = {
  onSubmit: (values: SwapValues) => Promise<void> | void;
  defaultFrom?: string;
  defaultTo?: string;
  fixedFrom?: string;
  fixedTo?: string;
};

export default function SwapForm({ onSubmit, defaultFrom = 'USDT', defaultTo = 'USDT', fixedFrom, fixedTo }: Props) {
  const uid = useUserId();
  // Initialize tokens honoring fixedFrom/fixedTo if provided
  const [fromToken, setFromToken] = useState((fixedFrom ?? defaultFrom ?? 'USDT').toUpperCase());
  const [toToken, setToToken] = useState((fixedTo ?? defaultTo ?? 'USDT').toUpperCase());
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [infiniteApproval, setInfiniteApproval] = useState(false);
  const [quote, setQuote] = useState<{ dstAmount: string; estimatedGas?: string | number } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string>('');
  const [quotedInput, setQuotedInput] = useState<{ fromToken: string; toToken: string; amount: string } | null>(null);
  const [walletTokens, setWalletTokens] = useState<TokenInfo[] | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Load wallet tokens once we have uid (to show balances and Max)
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!uid) return;
      setWalletLoading(true);
      try {
        const info = await getWalletInfo(uid);
        if (!cancelled) setWalletTokens(info.tokens || []);
      } catch {
        if (!cancelled) setWalletTokens(null);
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [uid]);

  const parseAmount = (v: string) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : NaN;
  };

  const currentBalance = React.useMemo(() => {
    if (!walletTokens) return undefined;
    const t = walletTokens.find(t => t.symbol.toUpperCase() === fromToken.toUpperCase());
    const n = t ? parseFloat(t.balance || '0') : 0;
    return isFinite(n) ? n : 0;
  }, [walletTokens, fromToken]);

  const validateAmount = React.useCallback((a: string) => {
    if (!a) return 'Please enter an amount.';
    const n = parseAmount(a);
    if (!isFinite(n) || n <= 0) return 'Invalid amount.';
    if (typeof currentBalance === 'number' && n > currentBalance) return 'Exceeds available balance.';
    return null;
  }, [currentBalance]);

  React.useEffect(() => {
    setAmountError(validateAmount(amount));
  }, [amount, validateAmount]);

  const quoteValid = React.useMemo(() => {
    if (!quote || !quotedInput) return false;
    return (
      quotedInput.fromToken === fromToken.trim().toUpperCase() &&
      quotedInput.toToken === toToken.trim().toUpperCase() &&
      quotedInput.amount === amount.trim()
    );
  }, [quote, quotedInput, fromToken, toToken, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateAmount(amount);
    setAmountError(err);
    if (err) return;

    // Ensure we have a fresh quote for the current inputs
    let hasValidQuote = quoteValid;
    if (!hasValidQuote) {
      setQuote(null);
      setQuoteError(null);
      setLoadingQuote(true);
      try {
        if (!fromToken || !toToken || !amount) throw new Error('Please select tokens and enter an amount.');
        const q = await getQuote({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim() });
        setQuote({ dstAmount: q.dstAmount, estimatedGas: q.estimatedGas });
        setQuotedInput({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim() });
        hasValidQuote = true;
      } catch (e: any) {
        setQuoteError(e?.response?.data?.message || e?.message || 'Unable to fetch quote.');
        hasValidQuote = false;
      } finally {
        setLoadingQuote(false);
      }
    }

    // Require PIN to proceed with the swap
    if (!hasValidQuote || !pin) return;

    setSubmitting(true);
    try {
      await onSubmit({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim(), pin, infiniteApproval, refCode: refCode.trim() || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  // Keep state in sync if fixed tokens change
  React.useEffect(() => {
    if (fixedFrom) setFromToken(fixedFrom.toUpperCase());
  }, [fixedFrom]);
  React.useEffect(() => {
    if (fixedTo) setToToken(fixedTo.toUpperCase());
  }, [fixedTo]);

  const setMaxAmount = () => {
    if (typeof currentBalance === 'number' && isFinite(currentBalance)) {
      // set to full balance without scientific notation, trim trailing zeros
      const v = (Math.floor(currentBalance * 1e6) / 1e6).toString();
      setAmount(v);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="label">From token</label>
          <div className="input flex items-center bg-gray-900">
            <span className="truncate">{fromToken}</span>
          </div>
        </div>
        <div className="flex-1">
          {fixedTo ? (
            <>
              <label className="label">To token</label>
              <div className="input flex items-center bg-gray-900">
                <span className="truncate">{toToken}</span>
              </div>
            </>
          ) : (
            <TokenPicker
              label="To token"
              value={toToken}
              onChange={(v) => { setToToken(v); setQuote(null); setQuotedInput(null); setQuoteError(null); }}
              excludeSymbols={[fromToken]}
            />
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Amount</label>
          <div className="text-xs text-gray-400">
            {walletLoading ? 'Loading balance...' : (typeof currentBalance === 'number' ? `Available: ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(currentBalance)} ${fromToken}` : '\u00A0')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className={`input ${amountError ? 'input-error' : ''}`}
            placeholder="0.0"
            inputMode="decimal"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAmount(e.target.value); setQuote(null); setQuotedInput(null); setQuoteError(null); }}
            aria-invalid={!!amountError}
            aria-describedby={amountError ? 'amount-error' : undefined}
          />
          <button type="button" className="button-secondary" onClick={setMaxAmount} disabled={typeof currentBalance !== 'number'}>
            Max
          </button>
        </div>
        {amountError && <div id="amount-error" className="input-hint-error">{amountError}</div>}
      </div>

      <div className="flex items-center justify-start">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={infiniteApproval} onChange={(e) => setInfiniteApproval(e.target.checked)} />
          Infinite approval (ERC20)
        </label>
      </div>

      {quote && (
        <div className="text-sm text-gray-400 space-y-1">
          <div>
            Estimated receive: <span className="font-medium text-gray-100">{quote.dstAmount} {toToken}</span>
          </div>
          {quote.estimatedGas ? <div>Estimated gas: ~{String(quote.estimatedGas)}</div> : null}
          <div className="text-xs text-gray-500">Prices may change depending on network conditions.</div>
        </div>
      )}
      {quoteError && (
        <div className="text-sm text-red-400">{quoteError}</div>
      )}

      <PinInput value={pin} onChange={setPin} />
      <button className="button-primary w-full" type="submit" disabled={submitting || loadingQuote || !fromToken || !toToken || !amount || !!amountError}>
        {submitting ? (
          <span className="inline-flex items-center justify-center gap-2"><span className="spinner" /> Submitting...</span>
        ) : loadingQuote ? (
          <span className="inline-flex items-center justify-center gap-2"><span className="spinner" /> Estimating...</span>
        ) : !quoteValid ? (
          'Get quote'
        ) : !pin ? (
          'Enter PIN to confirm'
        ) : (
          'Confirm Swap'
        )}
      </button>
    </form>
  );
}
