import React from 'react';
import dynamic from 'next/dynamic';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@components/AdminLayout';
import Toggle from '@components/Toggle';

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
    <AdminLayout title="Admin · Features" subtitle="Toggle features and maintenance mode">
      <div className="max-w-3xl space-y-6">
        <div className="space-y-3 p-4 border border-gray-800 rounded-md bg-gray-900/30">
          <div>
            <label className="block text-sm font-medium mb-1">Admin API Token</label>
            <input className="w-full rounded px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="x-admin-token" value={token} onChange={e => setToken(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Token sẽ được lưu tạm trong LocalStorage của trình duyệt.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            <Toggle checked={!!features.enableBuy} onChange={(v) => setFeatures((f:any) => ({ ...f, enableBuy: v }))} label="Enable Buy" description="Show Buy tab in bottom nav" />
            <Toggle checked={!!features.enableSwap} onChange={(v) => setFeatures((f:any) => ({ ...f, enableSwap: v }))} label="Enable Swap" description="Allow swap form on token page" />
            <Toggle checked={!!features.maintenanceMode} onChange={(v) => setFeatures((f:any) => ({ ...f, maintenanceMode: v }))} label="Maintenance Mode" description="Show maintenance banner and restrict actions" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={load} disabled={loading}>Load</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={save} disabled={loading}>Save</button>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-400">Đang xử lý...</div>}
        {error && <div className="text-sm text-red-400">Lỗi: {error}</div>}
        {result && (
          <pre className="p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </AdminLayout>
  );
}

export default dynamic(() => Promise.resolve(AdminFeaturesPage), { ssr: false });

export const getServerSideProps: GetServerSideProps = async () => {
  const portalUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || 'http://localhost:3100';
  return {
    redirect: {
      destination: `${portalUrl}/features`,
      permanent: false,
    },
  };
};
