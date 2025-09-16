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

function AdminFeaturesPage() {
  const [token, setToken] = useLocalStorage('admin_api_token', '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [features, setFeatures] = React.useState<any>({ enableSwap: true, enableBuy: true, maintenanceMode: false });
  const [result, setResult] = React.useState<any>(null);

  const headers: Record<string, string> = token ? { 'x-admin-token': token } : {};

  const load = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const resp = await fetch('/api/admin/features', { headers } as any);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setFeatures(data || {});
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const save = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const resp = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(features),
      } as any);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Features Admin</h1>

      <div className="space-y-3 p-4 border rounded-md">
        <div>
          <label className="block text-sm font-medium mb-1">Admin API Token</label>
          <input className="w-full border rounded px-3 py-2" placeholder="x-admin-token" value={token} onChange={e => setToken(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Token sẽ được lưu tạm trong LocalStorage của trình duyệt.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!features.enableBuy} onChange={(e) => setFeatures((f:any) => ({ ...f, enableBuy: e.target.checked }))} />
            <span className="text-sm">Enable Buy</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!features.enableSwap} onChange={(e) => setFeatures((f:any) => ({ ...f, enableSwap: e.target.checked }))} />
            <span className="text-sm">Enable Swap</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!features.maintenanceMode} onChange={(e) => setFeatures((f:any) => ({ ...f, maintenanceMode: e.target.checked }))} />
            <span className="text-sm">Maintenance Mode</span>
          </label>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={load} disabled={loading}>Load</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={save} disabled={loading}>Save</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Đang xử lý...</div>}
      {error && <div className="text-sm text-red-600">Lỗi: {error}</div>}
      {result && (
        <pre className="p-4 bg-gray-50 border rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminFeaturesPage), { ssr: false });
