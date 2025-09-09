import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Notification from '@components/Notification';
import TokenList from '@components/TokenList';
import { getWalletInfo, TokenInfo } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function DashboardPage() {
  const uid = useUserId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!uid) return;
      setLoading(true);
      setError(null);
      try {
        const info = await getWalletInfo(uid);
        setAddress(info.walletAddress);
        setTokens(info.tokens || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin ví.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uid]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {!uid && (
        <Notification type="warning" message="Thiếu uid trong URL. Hãy mở từ chatbot hoặc quay lại trang chủ để nhập uid." />
      )}
      {error && <Notification type="error" message={error} />}

      <div className="card space-y-1">
        <div className="text-sm text-gray-600">Địa chỉ ví</div>
        <div className="font-mono break-all">{address || (loading ? 'Đang tải...' : '-')}</div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Tài sản</h2>
        {loading ? (
          <div className="card">Đang tải số dư...</div>
        ) : (
          <TokenList tokens={tokens} showTotal />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <a className={`button-primary text-center ${!uid ? 'pointer-events-none opacity-50' : ''}`} href={withUidPath('/swap', uid)}>Swap token</a>
        <a className={`button-primary text-center ${!uid ? 'pointer-events-none opacity-50' : ''}`} href={withUidPath('/set-pin', uid)}>Đổi mã PIN</a>
        <a className={`button-primary text-center ${!uid ? 'pointer-events-none opacity-50' : ''}`} href={withUidPath('/buy-usdt', uid)}>Mua USDT</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false });
