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

function AdminUsersPage() {
  const [token, setToken] = useLocalStorage('admin_api_token', '');
  const [q, setQ] = React.useState('');
  const [limit, setLimit] = React.useState('200');
  const [uids, setUids] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<any>(null);
  const [metaStr, setMetaStr] = React.useState<string>('{}');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const headers: Record<string, string> = token ? { 'x-admin-token': token } : {};

  const search = async () => {
    setLoading(true); setError(null); setDetail(null); setSelected(null);
    try {
      const qs = `?limit=${encodeURIComponent(limit || '200')}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
      const resp = await fetch(`/api/admin/users${qs}`, { headers } as any);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setUids(data?.uids || []);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const loadDetail = async (uid: string) => {
    setLoading(true); setError(null); setDetail(null); setSelected(uid);
    try {
      const resp = await fetch(`/api/admin/users/${encodeURIComponent(uid)}`, { headers } as any);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setDetail(data);
      setMetaStr(JSON.stringify(data?.metadata || {}, null, 2));
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const saveMeta = async () => {
    if (!selected) return;
    setLoading(true); setError(null);
    try {
      let parsed: any = {};
      try { parsed = JSON.parse(metaStr || '{}'); } catch { throw new Error('metadata must be valid JSON'); }
      const resp = await fetch(`/api/admin/users/${encodeURIComponent(selected)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ metadata: parsed }),
      } as any);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setDetail(data);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const deleteUser = async () => {
    if (!selected) return;
    if (!confirm(`Delete user ${selected}? This cannot be undone.`)) return;
    setLoading(true); setError(null);
    try {
      const resp = await fetch(`/api/admin/users/${encodeURIComponent(selected)}`, {
        method: 'DELETE',
        headers: headers as any,
      } as any);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed');
      setDetail(null);
      setUids((arr) => arr.filter((u) => u !== selected));
      setSelected(null);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Users Admin</h1>

      <div className="space-y-3 p-4 border rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Admin API Token</label>
            <input className="w-full border rounded px-3 py-2" placeholder="x-admin-token" value={token} onChange={(e) => setToken(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Token sẽ được lưu tạm trong LocalStorage của trình duyệt.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search (q)</label>
            <input className="w-full border rounded px-3 py-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="fb_..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Limit</label>
            <input className="w-full border rounded px-3 py-2" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={search} disabled={loading}>Search</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <div className="border rounded divide-y max-h-[60vh] overflow-auto">
            {uids.map((u) => (
              <button key={u} className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selected === u ? 'bg-gray-100' : ''}`} onClick={() => loadDetail(u)}>
                <div className="font-mono text-sm">{u}</div>
              </button>
            ))}
            {uids.length === 0 && <div className="text-sm text-gray-500 p-3">No users</div>}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Details</h2>
          {!detail && <div className="text-sm text-gray-500">Select a user to view details.</div>}
          {detail && (
            <>
              <pre className="p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-[30vh]">{JSON.stringify(detail, null, 2)}</pre>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Metadata (JSON)</label>
                <textarea className="w-full border rounded p-2 font-mono text-xs min-h-[160px]" value={metaStr} onChange={(e) => setMetaStr(e.target.value)} />
                <div className="flex gap-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={saveMeta} disabled={loading}>Save metadata</button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={deleteUser} disabled={loading}>Delete user</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Đang xử lý...</div>}
      {error && <div className="text-sm text-red-600">Lỗi: {error}</div>}
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminUsersPage), { ssr: false });
