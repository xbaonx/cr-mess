import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import TokenList from '@components/TokenList';
import Notification from '@components/Notification';
import { TokenListSkeleton } from '@components/SkeletonLoader';
import { getWalletInfo, WalletInfoResponse, getTokens } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function DashboardPage() {
  const uid = useUserId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [tokens, setTokens] = useState<WalletInfoResponse['tokens']>([]);
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [info, market] = await Promise.all([
          getWalletInfo(uid),
          getTokens({ limit: 200 }),
        ]);
        if (!cancelled) {
          setAddress(info.walletAddress);
          setTokens(info.tokens || []);
          const map: Record<string, string> = {};
          for (const t of market) {
            if (t.logoURI) map[t.symbol.toUpperCase()] = t.logoURI;
          }
          setLogoMap(map);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Unable to load wallet info.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [uid]);

  const displayTokens = tokens.map(t => ({
    ...t,
    logoUrl: t.logoUrl || logoMap[t.symbol?.toUpperCase?.()] || undefined,
  }));
  const totalValue = displayTokens.reduce((acc, t) => acc + (parseFloat(t.balance || '0') * (t.priceUsd || 0)), 0);

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Portfolio
        </h1>
        <div className="text-sm text-gray-400">
          {loading ? '•••' : `$${totalValue.toFixed(2)}`}
        </div>
      </div>

      {!uid && (
        <Notification type="warning" message="Missing uid in URL. Open from the chatbot or go back home to enter a uid." />
      )}
      {error && <Notification type="error" message={error} />}

      {/* Wallet Address Card */}
      <div className="glass-card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-300">Wallet Address</div>
            <div className="text-xs text-gray-500">Your crypto address</div>
          </div>
        </div>
        <div className="font-mono text-sm bg-gray-900/50 rounded-lg p-3 break-all border border-gray-700/30">
          {address || (loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ) : (
            <span className="text-gray-500">No address available</span>
          ))}
        </div>
      </div>

      {/* Assets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-200">Assets</h2>
          {!loading && tokens.length > 0 && (
            <div className="text-sm text-gray-400">{tokens.length} tokens</div>
          )}
        </div>
        
        {loading ? (
          <TokenListSkeleton />
        ) : (
          <div className="animate-fade-in">
            <TokenList tokens={displayTokens} showTotal />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a 
          href={withUidPath('/markets', uid)} 
          className="button-primary text-center group flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Buy token
        </a>
        
        <a 
          href={withUidPath('/set-pin', uid)} 
          className="button-secondary text-center group flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Change PIN
        </a>
        
        <a 
          href={withUidPath('/buy-usdt', uid)} 
          className="button-secondary text-center group flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Buy USDT
        </a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false });
