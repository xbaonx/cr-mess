import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useUserId } from '@utils/useUserId';
import Notification from '@components/Notification';

function HomePage() {
  const uid = useUserId();
  const [localUid, setLocalUid] = useState('');

  useEffect(() => {
    if (uid) setLocalUid(uid);
  }, [uid]);

  const linkSuffix = localUid ? `?uid=${encodeURIComponent(localUid)}` : '';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Crypto WebView</h1>
      {!localUid && (
        <Notification type="info" message="Thiếu uid trong URL. Hãy mở từ chatbot Facebook Messenger hoặc nhập uid để thử nghiệm." />
      )}
      <div className="card space-y-3">
        <label className="label">UID (ví dụ: fb_12345678)</label>
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
          Mở Markets
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/create${linkSuffix}`} className={`button-secondary text-center ${!localUid ? 'pointer-events-none opacity-50' : ''}`}>
            Tạo ví
          </Link>
          <Link href={`/import${linkSuffix}`} className={`button-secondary text-center ${!localUid ? 'pointer-events-none opacity-50' : ''}`}>
            Nhập ví
          </Link>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(HomePage), { ssr: false });
