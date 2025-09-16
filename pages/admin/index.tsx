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
  const portalUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || 'http://localhost:3100';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel (Deprecated)</h1>

      <div className="space-y-3 p-4 border rounded-md">
        <p className="text-sm text-gray-600">
          Khu vực admin đã được tách sang Admin Portal riêng với giao diện chuyên nghiệp (Ant Design).
          Vui lòng sử dụng Admin Portal mới để quản trị hệ thống.
        </p>
        <a href={portalUrl} target="_blank" rel="noreferrer" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Mở Admin Portal mới</a>
        <p className="text-xs text-gray-500">Mặc định khi chạy local: http://localhost:3100. Có thể cấu hình qua NEXT_PUBLIC_ADMIN_PORTAL_URL.</p>
      </div>

      <div className="text-sm text-gray-500">Các trang admin cũ đã ngưng sử dụng tại product UI.</div>

      <div className="text-xs text-gray-500">
        <p>- Admin Portal mới vẫn yêu cầu header <code>x-admin-token</code> khớp với biến môi trường <code>ADMIN_API_TOKEN</code>.</p>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminIndexPage), { ssr: false });
