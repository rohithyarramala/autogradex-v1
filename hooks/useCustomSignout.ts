import { useCallback } from 'react';
import { useRouter } from 'next/router';

export const useCustomSignOut = () => {
  const router = useRouter();

  return useCallback(async () => {
    try {
      const res = await fetch('/api/auth/custom-signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Try to read server-provided redirect URL
      const payload =
        res.headers.get('content-type')?.includes('application/json') &&
        res.ok
          ? await res.json().catch(() => null)
          : null;
      const redirectUrl = payload?.url || '/auth/login';

      // Use full-page navigation to ensure cookies cleared and session state resets
      // Router.replace could be used for SPA nav, but full reload ensures cookies are removed
      // and any client-side auth caches are cleared.
      window.location.href = redirectUrl;
    } catch (err) {
      // Fallback: ensure we at least navigate to login
      console.error('Sign out failed, redirecting to login', err);
      window.location.href = '/auth/login';
    }
  }, [router]);
};

export default useCustomSignOut;