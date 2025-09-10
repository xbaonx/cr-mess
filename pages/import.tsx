import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { Wallet } from 'ethers';
import dynamic from 'next/dynamic';
import Notification from '@components/Notification';
import PinInput from '@components/PinInput';
import { encryptMnemonic, isValidPin } from '@utils/crypto';
import { importWallet } from '@utils/api';
import { useUserId, withUidPath } from '@utils/useUserId';

function ImportPage() {
  const uid = useUserId();
  const router = useRouter();

  const [mnemonic, setMnemonic] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!uid) return setError('Missing uid in URL.');
    const phrase = mnemonic.trim().replace(/\s+/g, ' ');
    try {
      // Validate mnemonic by constructing a wallet
      const w = Wallet.fromPhrase(phrase);
      if (!isValidPin(pin)) return setError('Invalid PIN (4-12 digits).');
      setLoading(true);
      const encryptedMnemonic = await encryptMnemonic(phrase, pin);
      await importWallet({
        userId: uid,
        encryptedMnemonic,
        walletAddress: w.address,
        pin,
      });
      router.replace(withUidPath('/dashboard', uid));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid mnemonic or an error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import Wallet</h1>
      {!uid && (
        <Notification type="warning" message="Missing uid in URL. Open from the chatbot or go back home to enter a uid." />
      )}
      {error && <Notification type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">12-word mnemonic</label>
          <textarea
            className="input h-28 resize-none"
            placeholder="cat dog ..."
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
          />
        </div>
        <PinInput value={pin} onChange={setPin} />
        <button className="button-primary w-full" disabled={!mnemonic || !pin || loading}>
          {loading ? 'Importing...' : 'Import wallet'}
        </button>
      </form>

      <div className="text-center">
        <a href={withUidPath('/dashboard', uid)} className="text-sm text-gray-500 underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(ImportPage), { ssr: false });
