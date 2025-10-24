import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Matching from './pages/Matching';
import Profile from './pages/Profile';
import Sessions from './pages/Sessions';
import Leaderboard from './pages/Leaderboard';
import Onboarding from './pages/Onboarding';
import UserProfile from './pages/UserProfile';
import { useAuthStore } from './store/authStore';
import { userAPI } from './services/api';
import OAuthSuccess from './pages/OAuthSuccess';
import { connectNotifications, disconnectNotifications } from './services/ws';
import toast from 'react-hot-toast';
import Resources from './pages/Resources';

export default function App() {
  const { token, user, setUser } = useAuthStore();
  const currentSub = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user) return;
      try {
        const { data } = await userAPI.getMe();
        if (!cancelled) setUser(data);
      } catch {
        // no-op: 401s are handled by Axios interceptor (auto logout if token invalid)
      }
    })();
    return () => { cancelled = true; };
  }, [token, user, setUser]);

  useEffect(() => {
    if (user?.id && currentSub.current !== user.id) {
      currentSub.current = user.id;
      connectNotifications(user.id, (n) => {
        try { toast.success(n.message || 'New notification'); } catch {}
      });
    }
    return () => { disconnectNotifications(); currentSub.current = null; };
  }, [user?.id]);
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth2/success" element={<OAuthSuccess />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/matching" element={<ProtectedRoute><Matching /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/user/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/resources" element={<Resources />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

