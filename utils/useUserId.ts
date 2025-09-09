import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function useUserId(): string | null {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let value: string | null = null;
    const q = router.query?.uid;
    if (typeof q === 'string') value = q;
    else if (Array.isArray(q)) value = q[0] ?? null;
    else if (typeof window !== 'undefined') {
      const u = new URL(window.location.href);
      value = u.searchParams.get('uid');
    }
    setUid(value);
  }, [router.query?.uid]);

  return uid;
}

export function withUidPath(path: string, uid: string | null) {
  return uid ? `${path}?uid=${encodeURIComponent(uid)}` : path;
}
