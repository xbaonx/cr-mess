import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ApiToken, getTokens } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';
import { MarketListSkeleton } from '@components/SkeletonLoader';

function MarketsPage() {
  const uid = useUserId();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getTokens({ limit: 50 });
        if (!cancelled) setTokens(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Unable to load tokens.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Markets
          </h1>
          <div className="text-sm text-gray-400">Live prices</div>
        </div>
        <MarketListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Markets
        </h1>
        <div className="card-elevated text-red-400 text-center">
          <div className="text-red-400/70 text-4xl mb-2">⚠️</div>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Markets
        </h1>
        <div className="text-sm text-gray-400">{tokens.length} tokens</div>
      </div>
      
      <div className="card-elevated p-0 overflow-hidden">
        {tokens.map((t, index) => (
          <a
            key={t.address}
            href={withUidPath(`/token/${encodeURIComponent(t.symbol)}`, uid)}
            className="flex items-center justify-between px-6 py-4 list-item border-b border-gray-800/30 last:border-b-0 group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              {t.logoURI ? (
                <img 
                  src={t.logoURI} 
                  alt={t.symbol} 
                  className="h-10 w-10 rounded-full object-cover bg-gray-800 ring-2 ring-gray-700/50 group-hover:ring-amber-500/30 transition-all duration-200" 
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold ring-2 ring-gray-700/50 group-hover:ring-amber-500/30 transition-all duration-200">
                  {t.symbol.slice(0, 3).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                  {t.symbol.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {t.name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-amber-400 transition-colors">
              <span className="text-xs font-medium">TRADE</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ))}
        {tokens.length === 0 && (
          <div className="text-center text-gray-400 text-sm p-12">
            <div className="text-gray-500 text-4xl mb-3">📊</div>
            <div className="font-medium">No tokens available</div>
            <div className="text-xs text-gray-500 mt-1">Check back later for updates</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(MarketsPage), { ssr: false });
