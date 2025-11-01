import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(email, password, totpRequired ? totpCode : undefined);
      setAuth(data.token, data.user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error?.response?.data;
      if (error?.response?.status === 401 && msg === 'TOTP_REQUIRED') {
        setTotpRequired(true);
        toast.error('Enter your 2FA code');
      } else {
        toast.error('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const base = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.replace('/api', '') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/10 dark:border-neutral-800 shadow-2xl rounded-3xl p-8"
      >
        <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-8 tracking-tight">
          Welcome Back 👋
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              required
            />
            {totpRequired && (
              <input
                type="text"
                placeholder="Authenticator code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                required
              />
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className={`w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:opacity-90 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Signing in...' : 'Login'}
          </motion.button>
        </form>

        {/* --- Divider --- */}
        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <span className="h-px w-24 bg-gray-300 dark:bg-neutral-700"></span>
            <span className="mx-2 text-gray-500 text-sm">or continue with</span>
            <span className="h-px w-24 bg-gray-300 dark:bg-neutral-700"></span>
          </div>

          {/* --- OAuth Buttons --- */}
          <div className="mt-4 flex flex-col gap-3">
            <a
              href={`${base}/oauth2/authorization/google`}
              className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-neutral-700 rounded-xl py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition text-gray-800 dark:text-neutral-200"
            >
              <span role="img" aria-label="Google">🌐</span>
              Continue with Google
            </a>
            <a
              href={`${base}/oauth2/authorization/github`}
              className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-neutral-700 rounded-xl py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition text-gray-800 dark:text-neutral-200"
            >
              <span role="img" aria-label="GitHub">💻</span>
              Continue with GitHub
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          Don’t have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
