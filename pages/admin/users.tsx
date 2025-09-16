import React from 'react';
import dynamic from 'next/dynamic';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@components/AdminLayout';
import CopyButton from '@components/CopyButton';
import Modal from '@components/Modal';

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
  const [limit, setLimit] = React.useState('5000');
  const [uids, setUids] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<any>(null);
  const [metaStr, setMetaStr] = React.useState<string>('{}');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openDelete, setOpenDelete] = React.useState(false);
  const headers: Record<string, string> = token ? { 'x-admin-token': token } : {};

  // Auto-load all users when admin token is available
  React.useEffect(() => {
    if (token && token.trim()) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    } finally { setLoading(false); setOpenDelete(false); }
  };

  return (
    <AdminLayout title="Admin · Users" subtitle="Search, inspect, edit metadata, or delete users">
      <div className="space-y-6">
        <div className="space-y-3 p-4 border border-gray-800 rounded-md bg-gray-900/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Admin API Token</label>
              <input className="w-full rounded px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="x-admin-token" value={token} onChange={(e) => setToken(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Token sẽ được lưu tạm trong LocalStorage của trình duyệt.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search (q)</label>
              <input className="w-full rounded px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" value={q} onChange={(e) => setQ(e.target.value)} placeholder="fb_..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Limit</label>
              <input className="w-full rounded px-3 py-2 bg-gray-900 text-gray-100 border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button className="bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50" onClick={search} disabled={loading}>Search</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 md:sticky md:top-4 h-fit">
            <h2 className="text-lg font-semibold">Users</h2>
            <div className="border border-gray-800 rounded divide-y divide-gray-800 max-h-[60vh] overflow-auto bg-gray-900/30">
              {uids.map((u) => (
                <button key={u} className={`w-full text-left px-3 py-2 hover:bg-gray-800/50 ${selected === u ? 'bg-gray-800' : ''}`} onClick={() => loadDetail(u)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-sm truncate">{u}</div>
                    <CopyButton text={u} />
                  </div>
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">UID</div>
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-200">
                    <span className="truncate max-w-[40ch]" title={selected || ''}>{selected}</span>
                    {selected && <CopyButton text={selected} />}
                  </div>
                </div>
                <pre className="p-3 bg-gray-900 text-gray-100 border border-gray-700 rounded text-xs overflow-auto max-h-[30vh]">{JSON.stringify(detail, null, 2)}</pre>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Metadata (JSON)</label>
                  <textarea className="w-full border border-gray-700 rounded p-2 font-mono text-xs min-h-[160px] bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30" value={metaStr} onChange={(e) => setMetaStr(e.target.value)} />
                  <div className="flex gap-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={saveMeta} disabled={loading}>Save metadata</button>
                    <button className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={() => setOpenDelete(true)} disabled={loading}>Delete user</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {loading && <div className="text-sm text-gray-400">Đang xử lý...</div>}
        {error && <div className="text-sm text-red-400">Lỗi: {error}</div>}
      </div>

      <Modal open={openDelete} onClose={() => setOpenDelete(false)} onConfirm={deleteUser} confirmText="Delete" danger title="Delete user?">
        This action will permanently delete the user record and cannot be undone.
      </Modal>
    </AdminLayout>
  );
}

export default dynamic(() => Promise.resolve(AdminUsersPage), { ssr: false });

export const getServerSideProps: GetServerSideProps = async () => {
  const portalUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || 'http://localhost:3100';
  return {
    redirect: {
      destination: `${portalUrl}/users`,
      permanent: false,
    },
  };
};
