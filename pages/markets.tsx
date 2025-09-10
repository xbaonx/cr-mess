import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ApiToken, getTokens } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function MarketsPage() {
  const uid = useUserId();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getTokens({ limit: 200 });
        if (!cancelled) setTokens(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Không thể tải danh sách token.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Markets</h1>
        <a className="text-sm text-gray-500 underline" href={withUidPath('/dashboard', uid)}>Dashboard</a>
      </div>

      <div className="card p-0">
        {loading && (
          <div className="p-4 text-sm text-gray-500">Đang tải...</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && (
          <ul>
            {tokens.map((t) => (
              <li key={t.address}>
                <a
                  href={withUidPath(`/token/${encodeURIComponent(t.symbol)}`, uid)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                      {t.symbol.slice(0, 4).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{t.symbol.toUpperCase()}</div>
                      <div className="text-xs text-gray-500">{t.name}</div>
                    </div>
                  </div>
                  <div className="text-gray-400">›</div>
                </a>
              </li>
            ))}
            {tokens.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500">Không có dữ liệu</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(MarketsPage), { ssr: false });
