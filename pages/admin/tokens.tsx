import React from 'react';
import dynamic from 'next/dynamic';

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

function AdminTokensPage() {
  const [token, setToken] = useLocalStorage('admin_api_token', '');
  const [limit, setLimit] = React.useState<string>('500');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const viewCatalog = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const qs = `?limit=${encodeURIComponent(limit || '500')}`;
      const resp = await fetch(`/api/admin/tokens/catalog${qs}`, {
        headers: token ? { 'x-admin-token': token } as any : undefined,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const refreshCatalog = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const resp = await fetch('/api/admin/tokens/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-token': token } : {}),
        } as any,
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
      <h1 className="text-2xl font-bold">Tokens Admin</h1>

      <div className="space-y-3 p-4 border rounded-md">
        <div>
          <label className="block text-sm font-medium mb-1">Admin API Token</label>
          <input className="w-full border rounded px-3 py-2" placeholder="x-admin-token" value={token} onChange={e => setToken(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Token sẽ được lưu tạm trong LocalStorage của trình duyệt.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Limit</label>
            <input className="w-full border rounded px-3 py-2" value={limit} onChange={e => setLimit(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={viewCatalog} disabled={loading}>View catalog</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={refreshCatalog} disabled={loading}>Refresh catalog</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Đang xử lý...</div>}
      {error && <div className="text-sm text-red-600">Lỗi: {error}</div>}
      {result && (
        <pre className="p-4 bg-gray-50 border rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}

      <div className="text-xs text-gray-500">
        <p>- Danh mục token được lưu trong DATA_DIR theo chainId và cũng cache trong bộ nhớ. Sử dụng nút Refresh để rebuild từ 1inch.</p>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminTokensPage), { ssr: false });
