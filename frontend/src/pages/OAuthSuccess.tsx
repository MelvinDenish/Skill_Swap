import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await userAPI.getMe();
        if (!cancelled) {
          setUser(data);
          toast.success('Logged in via OAuth');
          navigate('/dashboard');
        }
      } catch {
        toast.error('Login verification failed');
        navigate('/login');
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">Finishing login...</div>
  );
}
