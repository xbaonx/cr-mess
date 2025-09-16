import React from 'react';

export function useAdminToken() {
  const [token, setToken] = React.useState<string>('');
  React.useEffect(() => {
    try { setToken(localStorage.getItem('admin_api_token') || ''); } catch {}
  }, []);
  const save = React.useCallback((v: string) => {
    setToken(v);
    try { localStorage.setItem('admin_api_token', v); } catch {}
  }, []);
  return { token, setToken: save };
}
