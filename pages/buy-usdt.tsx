import { useEffect, useState, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Notification from '@components/Notification';
import { getWalletInfo } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function BuyUSDTPage() {
  const uid = useUserId();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const amt = parseFloat(amount);
    if (!uid) return setError('Missing uid in URL.');
    if (!address) return setError('Wallet address not available.');
    if (!isFinite(amt) || amt <= 0) return setError('Invalid amount.');

    const url = `https://moonpay.com/buy?currency=usdt&amount=${encodeURIComponent(
      amt.toString()
    )}&walletAddress=${encodeURIComponent(address)}`;
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
        <div className="card space-y-1">
          <div className="text-sm text-gray-400">Wallet address</div>
          <div className="font-mono break-all">{address || (loading ? 'Loading...' : '-')}</div>
        </div>
        <div>
          <label className="label">USDT amount</label>
          <input
            className="input"
            placeholder="100"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button className="button-primary w-full" disabled={!amount || !address || loading}>Buy via MoonPay</button>
      </form>

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(BuyUSDTPage), { ssr: false });
