import Link from 'next/link';
import dynamic from 'next/dynamic';
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

function AdminIndexPage() {
  const [token, setToken] = useLocalStorage('admin_api_token', '');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <div className="space-y-3 p-4 border rounded-md">
        <div>
          <label className="block text-sm font-medium mb-1">Admin API Token</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="x-admin-token"
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Token sẽ được lưu trong LocalStorage của trình duyệt.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/referral" className="button-secondary text-center">Referral Admin</Link>
        <Link href="/admin/tokens" className="button-secondary text-center">Tokens Admin</Link>
      </div>

      <div className="text-xs text-gray-500">
        <p>- Các trang admin yêu cầu header <code>x-admin-token</code> khớp với biến môi trường <code>ADMIN_API_TOKEN</code>.</p>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminIndexPage), { ssr: false });
