import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withUidPath, useUserId } from '@utils/useUserId';
import Notification from '@components/Notification';
import { getWalletInfo } from '@utils/api';

function HomePage() {
  const router = useRouter();
  const uid = useUserId();
  const [localUid, setLocalUid] = useState('');
  const [checkingWallet, setCheckingWallet] = useState(false);

  useEffect(() => {
    if (uid) setLocalUid(uid);
  }, [uid]);

  const linkSuffix = localUid ? `?uid=${encodeURIComponent(localUid)}` : '';

  // If uid exists, redirect to dashboard immediately for streamlined UX
  useEffect(() => {
    if (!router.isReady) return;
    if (uid) {
      router.replace(withUidPath('/dashboard', uid));
    }
  }, [uid, router.isReady, router]);

  // Optional background check (non-blocking)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!uid) return;
      setCheckingWallet(true);
      try {
        await getWalletInfo(uid);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCheckingWallet(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [uid]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Crypto WebView</h1>
      {!localUid && (
        <Notification type="info" message="Missing uid in URL. Open from the chatbot or enter a uid to try it out." />
      )}
      <div className="card space-y-3">
        <label className="label">UID (e.g., fb_12345678)</label>
        <input
          className="input"
          placeholder="fb_12345678"
          value={localUid}
          onChange={(e) => setLocalUid(e.target.value)}
          inputMode="text"
        />
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Link href={`/markets${linkSuffix}`} className={`button-primary text-center ${!localUid ? 'pointer-events-none opacity-50' : ''}`}>
          Open Markets
        </Link>
        {checkingWallet && (
          <div className="text-center text-xs text-gray-500">Checking existing wallet...</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/create${linkSuffix}`} className={`button-secondary text-center ${!localUid ? 'pointer-events-none opacity-50' : ''}`}>
            Create wallet
          </Link>
          <Link href={`/import${linkSuffix}`} className={`button-secondary text-center ${!localUid ? 'pointer-events-none opacity-50' : ''}`}>
            Import wallet
          </Link>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(HomePage), { ssr: false });
