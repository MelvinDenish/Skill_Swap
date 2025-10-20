import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../services/api';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token, user, setUser } = useAuthStore();
  const persistApi = (useAuthStore as any).persist;
  const [hydrated, setHydrated] = useState<boolean>(persistApi?.hasHydrated?.() ?? false);
  const [checking, setChecking] = useState<boolean>(!token && !user);

  useEffect(() => {
    const unsub = persistApi?.onFinishHydration?.(() => setHydrated(true));
    setHydrated(persistApi?.hasHydrated?.() ?? true);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [persistApi]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        try {
          const { data } = await userAPI.getMe();
          if (!cancelled) setUser(data);
        } catch {
          // no-op
        } finally {
          if (!cancelled) setChecking(false);
        }
      } else {
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [hydrated, user, setUser]);

  if (token || user) return children;
  if (!hydrated || checking) return <div className="p-6 text-center">Loading...</div>;
  return <Navigate to="/login" />;
}
