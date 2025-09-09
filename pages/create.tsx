import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Wallet } from 'ethers';
import Notification from '@components/Notification';
import PinInput from '@components/PinInput';
import { encryptMnemonic, isValidPin } from '@utils/crypto';
import { saveCreatedWallet } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function CreatePage() {
  const uid = useUserId();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [pin, setPin] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate a new wallet once on mount
    const w = Wallet.createRandom();
    setAddress(w.address);
    setMnemonic(w.mnemonic?.phrase || '');
  }, []);

  const canSubmit = useMemo(() => {
    return !!uid && !!address && !!mnemonic && isValidPin(pin);
  }, [uid, address, mnemonic, pin]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uid) return setError('Thiếu uid trong URL.');
    if (!isValidPin(pin)) return setError('PIN không hợp lệ (4-12 chữ số).');

    setLoading(true);
    setError(null);
    try {
      const encryptedMnemonic = await encryptMnemonic(mnemonic, pin);
      await saveCreatedWallet({
        userId: uid,
        encryptedMnemonic,
        walletAddress: address,
        pin,
      });
      router.replace(withUidPath('/dashboard', uid));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tạo ví mới</h1>
      {!uid && (
        <Notification type="warning" message="Thiếu uid trong URL. Hãy mở từ chatbot hoặc quay lại trang chủ để nhập uid." />
      )}
      {error && <Notification type="error" message={error} />}

      <div className="card space-y-2">
        <div className="text-sm text-gray-600">Địa chỉ ví</div>
        <div className="font-mono break-all">{address}</div>
      </div>

      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Mnemonic</div>
          <button type="button" className="text-blue-600 text-sm" onClick={() => setShowMnemonic((s: boolean) => !s)}>
            {showMnemonic ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        {showMnemonic ? (
          <div className="p-3 rounded bg-gray-100 text-sm font-mono break-words">{mnemonic}</div>
        ) : (
          <div className="text-sm text-gray-500">Được lưu an toàn sau khi đặt PIN.</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <PinInput value={pin} onChange={setPin} autoFocus />
        <button className="button-primary w-full" disabled={!canSubmit || loading}>
          {loading ? 'Đang lưu...' : 'Lưu ví và tiếp tục'}
        </button>
      </form>

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">
          Bỏ qua và xem Dashboard
        </a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(CreatePage), { ssr: false });
