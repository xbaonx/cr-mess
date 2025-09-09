import { useState, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Notification from '@components/Notification';
import PinInput from '@components/PinInput';
import { changePin } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function SetPinPage() {
  const uid = useUserId();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!uid) return setError('Thiếu uid trong URL.');
    if (!oldPin || !newPin) return setError('Vui lòng nhập đầy đủ thông tin.');
    setLoading(true);
    try {
      await changePin({ userId: uid, oldPin, newPin });
      setSuccess('Đổi PIN thành công.');
      setOldPin('');
      setNewPin('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể đổi PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Đổi mã PIN</h1>
      {!uid && (
        <Notification type="warning" message="Thiếu uid trong URL. Hãy mở từ chatbot hoặc quay lại trang chủ để nhập uid." />
      )}
      {error && <Notification type="error" message={error} />}
      {success && <Notification type="success" message={success} />}

      <form className="space-y-3" onSubmit={onSubmit}>
        <PinInput label="PIN hiện tại" value={oldPin} onChange={setOldPin} />
        <PinInput label="PIN mới" value={newPin} onChange={setNewPin} />
        <button className="button-primary w-full" disabled={!oldPin || !newPin || loading}>
          {loading ? 'Đang cập nhật...' : 'Cập nhật PIN'}
        </button>
      </form>

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">Quay lại Dashboard</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SetPinPage), { ssr: false });
