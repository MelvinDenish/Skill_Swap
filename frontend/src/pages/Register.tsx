import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

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

  useEffect(() => {}, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-violet-600 dark:bg-neutral-950 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-900 dark:text-neutral-100 dark:border dark:border-neutral-800 p-8 rounded-2xl shadow-2xl w-96">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            required
          />
          <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {(() => {
            const base = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.replace('/api','') || '';
            return (
              <>
                <a href={`${base}/oauth2/authorization/google`} className="block w-full text-center border border-gray-300 dark:border-neutral-800 rounded-lg py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">Continue with Google</a>
                <a href={`${base}/oauth2/authorization/github`} className="block w-full text-center border border-gray-300 dark:border-neutral-800 rounded-lg py-2 hover:bg-gray-50 dark:hover:bg-neutral-800">Continue with GitHub</a>
              </>
            );
          })()}
        </div>
        <p className="text-center mt-4 text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
