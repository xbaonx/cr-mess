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
};

type Props = {
  onSubmit: (values: SwapValues) => Promise<void> | void;
  defaultFrom?: string;
  defaultTo?: string;
};

export default function SwapForm({ onSubmit, defaultFrom = 'BNB', defaultTo = 'USDT' }: Props) {
  const uid = useUserId();
  // Force source token to USDT regardless of defaultFrom
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState(defaultTo);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [infiniteApproval, setInfiniteApproval] = useState(false);
  const [quote, setQuote] = useState<{ dstAmount: string; estimatedGas?: string | number } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
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
    if (!a) return 'Vui lòng nhập số lượng.';
    const n = parseAmount(a);
    if (!isFinite(n) || n <= 0) return 'Số lượng không hợp lệ.';
    if (typeof currentBalance === 'number' && n > currentBalance) return 'Vượt quá số dư khả dụng.';
    return null;
  }, [currentBalance]);

  React.useEffect(() => {
    setAmountError(validateAmount(amount));
  }, [amount, validateAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateAmount(amount);
    setAmountError(err);
    if (err) return;
    setSubmitting(true);
    try {
      await onSubmit({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim(), pin, infiniteApproval });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuote = async () => {
    setQuote(null);
    setQuoteError(null);
    setLoadingQuote(true);
    try {
      if (!fromToken || !toToken || !amount) throw new Error('Vui lòng chọn token và nhập số lượng.');
      const q = await getQuote({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim() });
      setQuote({ dstAmount: q.dstAmount, estimatedGas: q.estimatedGas });
    } catch (e: any) {
      setQuoteError(e?.response?.data?.message || e?.message || 'Không thể lấy ước tính.');
    } finally {
      setLoadingQuote(false);
    }
  };

  // Ensure fromToken always remains USDT
  React.useEffect(() => {
    if (fromToken.toUpperCase() !== 'USDT') setFromToken('USDT');
  }, [fromToken]);

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
          <label className="label">Từ token</label>
          <div className="input flex items-center justify-between bg-gray-50">
            <span className="truncate">USDT</span>
            <span className="text-gray-400">(cố định)</span>
          </div>
        </div>
        <div className="flex-1">
          <TokenPicker label="Đến token" value={toToken} onChange={(v) => { setToToken(v); setQuote(null); }} excludeSymbols={['USDT']} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Số lượng</label>
          <div className="text-xs text-gray-500">
            {walletLoading ? 'Đang tải số dư...' : (typeof currentBalance === 'number' ? `Available: ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(currentBalance)} ${fromToken}` : '\u00A0')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className={`input ${amountError ? 'input-error' : ''}`}
            placeholder="0.0"
            inputMode="decimal"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            aria-invalid={!!amountError}
            aria-describedby={amountError ? 'amount-error' : undefined}
          />
          <button type="button" className="button-secondary" onClick={setMaxAmount} disabled={typeof currentBalance !== 'number'}>
            Max
          </button>
        </div>
        {amountError && <div id="amount-error" className="input-hint-error">{amountError}</div>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={infiniteApproval} onChange={(e) => setInfiniteApproval(e.target.checked)} />
          Infinite approval (ERC20)
        </label>
        <button type="button" className="button-secondary px-3 py-2" onClick={handleQuote} disabled={!fromToken || !toToken || !amount || !!amountError || loadingQuote}>
          {loadingQuote ? (<span className="inline-flex items-center gap-2"><span className="spinner" /> Đang ước tính</span>) : 'Ước tính'}
        </button>
      </div>

      {quote && (
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            Ước tính nhận: <span className="font-medium">{quote.dstAmount} {toToken}</span>
          </div>
          {quote.estimatedGas ? <div>Gas ước tính: ~{String(quote.estimatedGas)}</div> : null}
          <div className="text-xs text-gray-500">Giá có thể thay đổi tùy vào điều kiện mạng.</div>
        </div>
      )}
      {quoteError && (
        <div className="text-sm text-red-600">{quoteError}</div>
      )}

      <PinInput value={pin} onChange={setPin} />
      <button className="button-primary w-full" type="submit" disabled={submitting || !fromToken || !toToken || !amount || !pin || !!amountError}>
        {submitting ? (<span className="inline-flex items-center justify-center gap-2"><span className="spinner" /> Đang gửi...</span>) : 'Xác nhận Swap'}
      </button>
    </form>
  );
}
