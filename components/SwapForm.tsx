import React, { useState } from 'react';
import PinInput from './PinInput';
import TokenPicker from './TokenPicker';

export type SwapValues = {
  fromToken: string;
  toToken: string;
  amount: string;
  pin: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ fromToken: fromToken.trim().toUpperCase(), toToken: toToken.trim().toUpperCase(), amount: amount.trim(), pin });
    } finally {
      setLoading(false);
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
      <PinInput value={pin} onChange={setPin} />
      <button className="button-primary w-full" type="submit" disabled={loading || !fromToken || !toToken || !amount || !pin}>
        {loading ? 'Đang gửi...' : 'Xác nhận Swap'}
      </button>
    </form>
  );
}
