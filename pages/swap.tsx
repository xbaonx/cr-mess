import { useState } from 'react';
import dynamic from 'next/dynamic';
import Notification from '@components/Notification';
import SwapForm, { SwapValues } from '@components/SwapForm';
import { swapRequest } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function SwapPage() {
  const uid = useUserId();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: SwapValues) => {
    setResult(null);
    setError(null);
    try {
      if (!uid) throw new Error('Thiếu uid trong URL.');
      const res = await swapRequest({
        userId: uid,
        fromToken: values.fromToken,
        toToken: values.toToken,
        amount: values.amount,
        pin: values.pin,
        infiniteApproval: values.infiniteApproval,
      });
      if (res?.txHash) {
        setResult(`Thành công! Tx Hash: ${res.txHash}`);
      } else if (res?.error) {
        setError(res.error);
      } else {
        setResult('Đã gửi yêu cầu swap. Vui lòng kiểm tra lịch sử giao dịch.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Giao dịch thất bại.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Swap Token</h1>
      {!uid && (
        <Notification type="warning" message="Thiếu uid trong URL. Hãy mở từ chatbot hoặc quay lại trang chủ để nhập uid." />
      )}
      {error && <Notification type="error" message={error} />}
      {result && <Notification type="success" message={result} />}

      <SwapForm onSubmit={onSubmit} />

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">Quay lại Dashboard</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SwapPage), { ssr: false });
