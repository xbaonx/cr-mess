import { useState } from 'react';
import dynamic from 'next/dynamic';
import Notification from '@components/Notification';
import SwapForm, { SwapValues } from '@components/SwapForm';
import { swapRequest } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';
import { useRouter } from 'next/router';

function SwapPage() {
  const router = useRouter();
  const uid = useUserId();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const defaultTo = typeof router.query.to === 'string' ? router.query.to.toUpperCase() : undefined;

  const onSubmit = async (values: SwapValues) => {
    setResult(null);
    setError(null);
    try {
      if (!uid) throw new Error('Missing uid in URL.');
      const res = await swapRequest({
        userId: uid,
        fromToken: values.fromToken,
        toToken: values.toToken,
        amount: values.amount,
        pin: values.pin,
        infiniteApproval: values.infiniteApproval,
      });
      if (res?.txHash) {
        setResult(`Success! Tx Hash: ${res.txHash}`);
      } else if (res?.error) {
        setError(res.error);
      } else {
        setResult('Swap request submitted. Please check your transaction history.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Transaction failed.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Swap Token</h1>
      {!uid && (
        <Notification type="warning" message="Missing uid in URL. Open from the chatbot or go back home to enter a uid." />
      )}
      {error && <Notification type="error" message={error} />}
      {result && <Notification type="success" message={result} />}

      {!defaultTo ? (
        <div className="card space-y-2">
          <div className="text-sm text-gray-400">Please choose a token before swapping.</div>
          <a href={withUidPath('/markets', uid)} className="button-primary text-center">Open Markets to choose a token</a>
        </div>
      ) : (
        <SwapForm onSubmit={onSubmit} defaultTo={defaultTo} />
      )}

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SwapPage), { ssr: false });
