import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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
          toast.success('Logged in successfully via OAuth 🎉');
          navigate('/dashboard');
        }
      } catch {
        toast.error('Login verification failed');
        navigate('/login');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/20 backdrop-blur-xl dark:bg-neutral-900/60 dark:border dark:border-neutral-800 text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 w-80"
      >
        <Loader2 className="animate-spin text-white w-10 h-10" />
        <h2 className="text-lg font-semibold tracking-wide">Finishing Login...</h2>
        <p className="text-sm text-white/80 text-center">
          Please wait while we verify your account and set things up.
        </p>
      </motion.div>
    </div>
  );
}
