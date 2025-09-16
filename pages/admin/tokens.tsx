import React from 'react';

export default function AdminTokensPage() {
  const [loading, setLoading] = React.useState(false);
  const [meta, setMeta] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [token, setToken] = React.useState('');

  const callMeta = async () => {
    setLoading(true); setError(null);
    try {
      const resp = await fetch('/api/tokens/meta', { headers: token ? { 'x-admin-token': token } as any : undefined });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setMeta(data);
    } catch (e: any) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      const resp = await fetch('/api/tokens/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) } as any });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setMeta(data);
    } catch (e: any) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { callMeta(); }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin: Tokens</h1>

      <div className="p-4 border rounded-md space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Admin API Token</label>
          <input className="w-full border rounded px-3 py-2" placeholder="x-admin-token" value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={callMeta} disabled={loading}>Check Meta</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={refresh} disabled={loading}>Refresh Catalog</button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Processing...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {meta && (
        <pre className="p-4 bg-gray-50 border rounded text-xs overflow-auto">{JSON.stringify(meta, null, 2)}</pre>
      )}
    </div>
  );
}
