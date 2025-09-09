import React, { useState } from 'react';
import PinInput from './PinInput';
import TokenPicker from './TokenPicker';
import { getQuote } from '@utils/api';

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
  const [fromToken, setFromToken] = useState(defaultFrom);
  const [toToken, setToToken] = useState(defaultTo);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [infiniteApproval, setInfiniteApproval] = useState(false);
  const [quote, setQuote] = useState<{ dstAmount: string; estimatedGas?: string | number } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim(), pin, infiniteApproval });
    } finally {
      setLoading(false);
    }
  };

  const handleQuote = async () => {
    setQuote(null);
    setQuoteError(null);
    try {
      if (!fromToken || !toToken || !amount) throw new Error('Vui lòng chọn token và nhập số lượng.');
      const q = await getQuote({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim() });
      setQuote({ dstAmount: q.dstAmount, estimatedGas: q.estimatedGas });
    } catch (e: any) {
      setQuoteError(e?.response?.data?.message || e?.message || 'Không thể lấy ước tính.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <TokenPicker label="Từ token" value={fromToken} onChange={setFromToken} />
      </div>
      <div>
        <TokenPicker label="Đến token" value={toToken} onChange={setToToken} />
      </div>
      <div>
        <label className="label">Số lượng</label>
        <input className="input" placeholder="0.0" inputMode="decimal" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={infiniteApproval} onChange={(e) => setInfiniteApproval(e.target.checked)} />
          Infinite approval (ERC20)
        </label>
        <button type="button" className="button-secondary px-3 py-2" onClick={handleQuote} disabled={!fromToken || !toToken || !amount}>
          Ước tính
        </button>
      </div>
      {quote && (
        <div className="text-sm text-gray-600">
          Ước tính nhận: <span className="font-medium">{quote.dstAmount} {toToken}</span>{' '}
          {quote.estimatedGas ? <span>(Gas ~ {String(quote.estimatedGas)})</span> : null}
        </div>
      )}
      {quoteError && (
        <div className="text-sm text-red-600">{quoteError}</div>
      )}
      <PinInput value={pin} onChange={setPin} />
      <button className="button-primary w-full" type="submit" disabled={loading || !fromToken || !toToken || !amount || !pin}>
        {loading ? 'Đang gửi...' : 'Xác nhận Swap'}
      </button>
    </form>
  );
}
