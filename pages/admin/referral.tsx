import React from 'react';

function useLocalStorage(key: string, initial: string = '') {
  const [val, setVal] = React.useState<string>(() => {
    if (typeof window === 'undefined') return initial;
    try { return localStorage.getItem(key) || initial; } catch { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, val); } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

export default function AdminReferralPage() {
  const [token, setToken] = useLocalStorage('admin_api_token', '');
  const [wallet, setWallet] = React.useState('');
  const [tokenAddr, setTokenAddr] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLedger = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const qs = wallet.trim() ? `?wallet=${encodeURIComponent(wallet.trim())}` : '';
      const resp = await fetch(`/api/referral/ledger${qs}`, {
        headers: token ? { 'x-admin-token': token } as any : undefined,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const payout = async (dryRun: boolean) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const body: any = { dryRun };
      if (wallet.trim()) body.wallet = wallet.trim().toLowerCase();
      if (tokenAddr.trim()) body.token = tokenAddr.trim().toLowerCase();
      const resp = await fetch('/api/referral/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {}),
        } as any,
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Referral Admin</h1>

      <div className="space-y-3 p-4 border rounded-md">
        <div>
          <label className="block text-sm font-medium mb-1">Admin API Token</label>
          <input className="w-full border rounded px-3 py-2" placeholder="x-admin-token" value={token} onChange={e => setToken(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Token này sẽ được lưu tạm trong LocalStorage của trình duyệt.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lọc theo ví ref (tuỳ chọn)</label>
            <input className="w-full border rounded px-3 py-2" placeholder="0x... hoặc bỏ trống" value={wallet} onChange={e => setWallet(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lọc theo token (tuỳ chọn)</label>
            <input className="w-full border rounded px-3 py-2" placeholder="0x... hoặc bỏ trống" value={tokenAddr} onChange={e => setTokenAddr(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={fetchLedger} disabled={loading}>Tải ledger</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={() => payout(true)} disabled={loading}>Dry run payout</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={() => payout(false)} disabled={loading}>Thực hiện payout</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Đang xử lý...</div>}
      {error && <div className="text-sm text-red-600">Lỗi: {error}</div>}
      {result && (
        <pre className="p-4 bg-gray-50 border rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}

      <div className="text-xs text-gray-500">
        <p>- Payout dùng ví admin (ADMIN_PRIVATE_KEY) trên chain hiện tại. Đảm bảo RPC_PROVIDER_URL, DATA_DIR, và mount disk đã cấu hình đúng.</p>
        <p>- MIN_PAYOUT_WEI giúp tránh chi trả các khoản quá nhỏ.</p>
      </div>
    </div>
  );
}
