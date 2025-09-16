import React from 'react';
import dynamic from 'next/dynamic';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@components/AdminLayout';

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
    <AdminLayout title="Admin · Tokens" subtitle="Inspect and refresh token catalog">
      <div className="space-y-6">
        <div className="space-y-3 p-4 border border-gray-800 rounded-md bg-gray-900/30">
          <div>
            <label className="block text-sm font-medium mb-1">Admin API Token</label>
            <input className="w-full rounded px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="x-admin-token" value={token} onChange={e => setToken(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Token sẽ được lưu tạm trong LocalStorage của trình duyệt.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Limit</label>
              <input className="w-full rounded px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" value={limit} onChange={e => setLimit(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={viewCatalog} disabled={loading}>View catalog</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={refreshCatalog} disabled={loading}>Refresh catalog</button>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-400">Đang xử lý...</div>}
        {error && <div className="text-sm text-red-400">Lỗi: {error}</div>}

        {result && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400">Updated: {result.updatedAt || 'unknown'} · Chain: {result.chainId} · Count: {result.count}</div>
            <div className="overflow-auto border border-gray-800 rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-900/60 text-gray-300">
                  <tr>
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Decimals</th>
                    <th className="text-left p-2">Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(result.tokens || []).slice(0, 50).map((t: any) => (
                    <tr key={t.address} className="hover:bg-gray-900/40">
                      <td className="p-2 font-medium text-gray-100">{t.symbol}</td>
                      <td className="p-2 text-gray-300">{t.name}</td>
                      <td className="p-2 text-gray-400">{t.decimals}</td>
                      <td className="p-2 font-mono text-xs text-gray-400 truncate max-w-[40ch]" title={t.address}>{t.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <pre className="p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>- Danh mục token được lưu trong DATA_DIR theo chainId và cũng cache trong bộ nhớ. Sử dụng nút Refresh để rebuild từ 1inch.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default dynamic(() => Promise.resolve(AdminTokensPage), { ssr: false });

export const getServerSideProps: GetServerSideProps = async () => {
  const portalUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || 'http://localhost:3100';
  return {
    redirect: {
      destination: `${portalUrl}/tokens`,
      permanent: false,
    },
  };
};
