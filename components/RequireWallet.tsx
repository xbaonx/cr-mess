import React from 'react';
import useSWR from 'swr';
import { getWalletInfo } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

export default function RequireWallet({ children }: { children: React.ReactNode }) {
  const uid = useUserId();
  const { data, error, isLoading } = useSWR(uid ? ['wallet-check', uid] : null, () => getWalletInfo(uid!), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  if (!uid) {
    return (
      <div className="card-elevated text-center p-6 space-y-3">
        <div className="text-amber-400 text-lg font-semibold">Missing UID</div>
        <div className="text-sm text-gray-400">Open from the chatbot or go back home to enter a UID.</div>
        <a href="/" className="button-secondary inline-block">Go to Home</a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-elevated p-6 text-center text-sm text-gray-400">
        <span className="spinner inline-block mr-2" /> Checking wallet...
      </div>
    );
  }

  // If API returned error (e.g., 404 Wallet not found), render choose UI
  // We don't inspect status code from here; simply treat missing data + error as no wallet
  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card-elevated p-6 text-center">
          <div className="text-lg font-semibold text-gray-200">No wallet found for this UID</div>
          <div className="text-sm text-gray-400 mt-1">Create a new wallet or import an existing one.</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a href={withUidPath('/create', uid)} className="button-primary text-center">Create wallet</a>
          <a href={withUidPath('/import', uid)} className="button-secondary text-center">Import wallet</a>
        </div>
      </div>
    );
  }

  // Has wallet
  return <>{children}</>;
}
