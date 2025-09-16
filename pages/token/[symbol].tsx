import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Notification from '@components/Notification';
import SwapForm, { SwapValues } from '@components/SwapForm';
import { TokenDetailSkeleton } from '@components/SkeletonLoader';
import { ApiToken, getTokens, swapRequest, getFeatures } from '@utils/api';
import { useUserId } from '@utils/useUserId';

function TokenDetailPage() {
  const router = useRouter();
  const uid = useUserId();
  const symbolParam = typeof router.query.symbol === 'string' ? router.query.symbol : '';
  const symbol = (symbolParam || '').toUpperCase();

  const [token, setToken] = useState<ApiToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  // Removed price/change/chart states
  const { data: features } = useSWR('features', getFeatures, { revalidateOnFocus: false, refreshInterval: 60000 });

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
        // Prices/changes removed
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Unable to load token info.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [symbol]);
  // Chart removed

  const onSubmit = async (values: SwapValues) => {
    setTxResult(null);
    setTxError(null);
    try {
      if (!uid) throw new Error('Missing uid in URL.');
      const res = await swapRequest({
        userId: uid,
        fromToken: values.fromToken,
        toToken: values.toToken,
        amount: values.amount,
        pin: values.pin,
        infiniteApproval: values.infiniteApproval,
        refCode: values.refCode,
      });
      if (res?.txHash) {
        setTxResult(`Success! Tx Hash: ${res.txHash}`);
      } else if (res?.error) {
        setTxError(res.error);
      } else {
        setTxResult('Swap request submitted. Please check your transaction history.');
      }
    } catch (err: any) {
      setTxError(err?.response?.data?.message || err?.message || 'Transaction failed.');
    }
  };

  if (loading) {
    return <TokenDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button 
            className="button-secondary px-3 py-2 h-10 w-10 flex items-center justify-center" 
            onClick={() => router.back()} 
            aria-label="Back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {symbol || 'Token'}
          </h1>
        </div>
        <div className="card-elevated text-red-400 text-center">
          <div className="text-red-400/70 text-4xl mb-2">⚠️</div>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <button 
          className="button-secondary px-3 py-2 h-10 w-10 flex items-center justify-center group" 
          onClick={() => router.back()} 
          aria-label="Back"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {symbol || 'Token'}
        </h1>
      </div>

      {!loading && !error && (
        <>
          {/* Token Info Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              {token?.logoURI ? (
                <img 
                  src={token.logoURI} 
                  alt={symbol} 
                  className="h-16 w-16 rounded-full object-cover bg-gray-800 ring-2 ring-gray-700/50" 
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-lg font-bold text-gray-900 ring-2 ring-amber-500/20">
                  {symbol.slice(0, 3)}
                </div>
              )}
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-100">{symbol}</div>
                <div className="text-gray-400 font-medium">{token?.name || 'Token'}</div>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-3 flex-wrap">Ready to trade</div>
              </div>
            </div>
          </div>

          {/* Chart removed */}

          {/* Buy/Swap Section (feature-gated) */}
          {features?.maintenanceMode && (
            <div className="card-elevated text-amber-400 text-sm p-4">Currently under maintenance. Some functions may be disabled.</div>
          )}
          {features?.enableSwap !== false ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-200">Buy {symbol}</h2>
                  <div className="text-sm text-gray-400">Convert USDT to {symbol}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              
              {txError && <Notification type="error" message={txError} />}
              {txResult && <Notification type="success" message={txResult} />}
              
              <div className="card-elevated">
                <SwapForm onSubmit={onSubmit} defaultTo={symbol} />
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Swaps are currently disabled.</div>
          )}
        </>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(TokenDetailPage), { ssr: false });
