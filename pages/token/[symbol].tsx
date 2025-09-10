import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { ApiToken, getTokens } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function TokenDetailPage() {
  const router = useRouter();
  const uid = useUserId();
  const symbolParam = typeof router.query.symbol === 'string' ? router.query.symbol : '';
  const symbol = (symbolParam || '').toUpperCase();

  const [token, setToken] = useState<ApiToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getTokens({ q: symbol, limit: 50 });
        const found = list.find(t => t.symbol.toUpperCase() === symbol) || null;
        if (!cancelled) setToken(found);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Unable to load token info.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [symbol]);

  const tradeHref = withUidPath(`/swap?to=${encodeURIComponent(symbol)}`, uid);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className="button-secondary px-3 py-1" onClick={() => router.back()} aria-label="Back">←</button>
        <h1 className="text-2xl font-bold">{symbol || 'Token'}</h1>
      </div>

      {loading && (<div className="card">Loading...</div>)}
      {error && (<div className="card text-red-400">{error}</div>)}

      {!loading && !error && (
        <>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold">
                {symbol.slice(0, 4)}
              </div>
              <div>
                <div className="text-xl font-semibold">{symbol}</div>
                <div className="text-sm text-gray-400">{token?.name || ''}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="h-40 w-full rounded-md bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
              Price chart (placeholder)
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <div className="font-medium">Convert</div>
              <div className="text-sm text-gray-400">Quickly convert between USDT and {symbol}</div>
            </div>
            <a href={tradeHref} className="button-primary">Trade</a>
          </div>
        </>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(TokenDetailPage), { ssr: false });
