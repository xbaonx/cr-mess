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
    if (!uid) return setError('Missing uid in URL.');
    if (!oldPin || !newPin) return setError('Please fill in all fields.');
    setLoading(true);
    try {
      await changePin({ userId: uid, oldPin, newPin });
      setSuccess('PIN updated successfully.');
      setOldPin('');
      setNewPin('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to change PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Change PIN</h1>
      {!uid && (
        <Notification type="warning" message="Missing uid in URL. Open from the chatbot or go back home to enter a uid." />
      )}
      {error && <Notification type="error" message={error} />}
      {success && <Notification type="success" message={success} />}

      <form className="space-y-3" onSubmit={onSubmit}>
        <PinInput label="Current PIN" value={oldPin} onChange={setOldPin} />
        <PinInput label="New PIN" value={newPin} onChange={setNewPin} />
        <button className="button-primary w-full" disabled={!oldPin || !newPin || loading}>
          {loading ? 'Updating...' : 'Update PIN'}
        </button>
      </form>

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SetPinPage), { ssr: false });
