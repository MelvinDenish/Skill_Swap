import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [providers, setProviders] = useState<string[]>([]);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await authAPI.login(email, password, totpRequired ? totpCode : undefined);
      setAuth(data.token, data.user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      const err: any = error;
      const msg = err?.response?.data;
      if (err?.response?.status === 401 && msg === 'TOTP_REQUIRED') {
        setTotpRequired(true);
        toast.error('Enter your 2FA code');
      } else {
        toast.error('Invalid credentials');
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authAPI.providers();
        setProviders(Array.isArray(data) ? data : []);
      } catch { setProviders([]); }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Welcome Back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          {totpRequired && (
            <input
              type="text"
              placeholder="Authenticator code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          )}
          <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90">
            Login
          </button>
        </form>
        {providers.length > 0 && (
          <div className="mt-4 space-y-2">
            {(() => {
              const base = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.replace('/api','') || '';
              return (
                <>
                  {providers.includes('google') && (
                    <a href={`${base}/oauth2/authorization/google`} className="block w-full text-center border border-gray-300 rounded-lg py-2 hover:bg-gray-50">Continue with Google</a>
                  )}
                  {providers.includes('github') && (
                    <a href={`${base}/oauth2/authorization/github`} className="block w-full text-center border border-gray-300 rounded-lg py-2 hover:bg-gray-50">Continue with GitHub</a>
                  )}
                </>
              );
            })()}
          </div>
        )}
        <p className="text-center mt-4 text-gray-600">
          Don't have an account? <Link to="/register" className="text-purple-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
