import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Github, Mail, UserPlus } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.register(name, email, password);
      setAuth(data.token, data.user);
      toast.success('Registration successful!');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err?.response?.data || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-neutral-950 dark:to-neutral-900 px-4">
      <div className="backdrop-blur-lg bg-white/10 dark:bg-neutral-900/80 border border-white/20 dark:border-neutral-800 rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white dark:text-neutral-100 flex items-center justify-center gap-2">
            <UserPlus className="w-7 h-7 text-fuchsia-300" />
            Join SkillSwap
          </h1>
          <p className="text-gray-200 dark:text-gray-400 mt-2 text-sm">
            Learn, teach, and connect through shared skills.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white/80 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
            required
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/80 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
            required
          />
          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/80 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
            required
          />
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-150 disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
          {(() => {
            const base = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.replace('/api', '') || '';
            return (
              <div className="space-y-3">
                <a
                  href={`${base}/oauth2/authorization/google`}
                  className="flex items-center justify-center gap-2 border border-gray-300 dark:border-neutral-700 rounded-lg py-2.5 bg-white/90 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all"
                >
                  <Mail className="w-5 h-5" /> Continue with Google
                </a>
                <a
                  href={`${base}/oauth2/authorization/github`}
                  className="flex items-center justify-center gap-2 border border-gray-300 dark:border-neutral-700 rounded-lg py-2.5 bg-white/90 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all"
                >
                  <Github className="w-5 h-5" /> Continue with GitHub
                </a>
              </div>
            );
          })()}
        </div>

        <p className="text-center mt-6 text-gray-300 dark:text-gray-400 text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-fuchsia-300 hover:text-fuchsia-400 font-medium transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
