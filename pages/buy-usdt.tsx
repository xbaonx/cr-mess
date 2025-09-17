import { useEffect, useState, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Notification from '@components/Notification';
import { getWalletInfo } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function BuyUSDTPage() {
  const uid = useUserId();
  const [amount, setAmount] = useState(''); // INR amount
  const [amountUsdt, setAmountUsdt] = useState(''); // USDT amount
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'INR' | 'USDT'>('INR');

  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      setLoading(true);
      setError(null);
      try {
        const info = await getWalletInfo(uid);
        setAddress(info.walletAddress);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load wallet address.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uid]);

  const handleBuy = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!uid) return setError('Missing uid in URL.');
    if (!address) return setError('Wallet address not available.');
    if (mode === 'INR') {
      const amtInr = parseFloat(amount);
      if (!isFinite(amtInr) || amtInr <= 0) return setError('Invalid INR amount.');
      const params = new URLSearchParams();
      params.set('cryptoCurrencyCode', 'USDT');
      params.set('defaultNetwork', 'bsc'); // BSC (BEP-20)
      params.set('fiatCurrency', 'INR');
      params.set('defaultFiatAmount', amtInr.toString());
      params.set('walletAddress', address);
      const url = `https://global.transak.com/?${params.toString()}`;
      window.location.href = url;
      return;
    }

    // USDT mode
    const amtUsdt = parseFloat(amountUsdt);
    if (!isFinite(amtUsdt) || amtUsdt <= 0) return setError('Invalid USDT amount.');
    const params = new URLSearchParams();
    params.set('cryptoCurrencyCode', 'USDT');
    params.set('defaultNetwork', 'bsc');
    params.set('fiatCurrency', 'INR');
    params.set('cryptoAmount', amtUsdt.toString());
    params.set('walletAddress', address);
    const url = `https://global.transak.com/?${params.toString()}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Buy USDT</h1>
      {!uid && (
        <Notification type="warning" message="Missing uid in URL. Open from the chatbot or go back home to enter a uid." />
      )}
      {error && <Notification type="error" message={error} />}

      <form onSubmit={handleBuy} className="space-y-3">
        <div className="card space-y-2">
          <div className="text-sm text-gray-400">Input mode</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('INR')} className={`px-3 py-1.5 rounded ${mode==='INR'?'bg-primary text-white':'bg-white/10 hover:bg-white/20'}`}>INR</button>
            <button type="button" onClick={() => setMode('USDT')} className={`px-3 py-1.5 rounded ${mode==='USDT'?'bg-primary text-white':'bg-white/10 hover:bg-white/20'}`}>USDT</button>
          </div>
        </div>
        <div className="card space-y-1">
          <div className="text-sm text-gray-400">Wallet address</div>
          <div className="font-mono break-all">{address || (loading ? 'Loading...' : '-')}</div>
        </div>
        {mode === 'INR' ? (
          <div>
            <label className="label">Amount (INR)</label>
            <input
              className="input"
              placeholder="1000"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="text-xs text-gray-400 mt-1">Will prefill defaultFiatAmount in Transak.</div>
          </div>
        ) : (
          <div>
            <label className="label">Amount (USDT)</label>
            <input
              className="input"
              placeholder="100"
              inputMode="decimal"
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
            />
            <div className="text-xs text-gray-400 mt-1">Will prefill cryptoAmount in Transak.</div>
          </div>
        )}
        <button className="button-primary w-full" disabled={!address || loading || (mode==='INR' ? !amount : !amountUsdt)}>Buy via Transak</button>
      </form>

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(BuyUSDTPage), { ssr: false });
