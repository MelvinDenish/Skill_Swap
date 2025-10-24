import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold">SkillSwap</Link>
        <div className="flex gap-6 items-center">
          <Link to="/dashboard" className="hover:text-purple-200">Dashboard</Link>
          <Link to="/matching" className="hover:text-purple-200">Find Matches</Link>
          <Link to="/sessions" className="hover:text-purple-200">Sessions</Link>
          <Link to="/leaderboard" className="hover:text-purple-200">Leaderboard</Link>
          <Link to="/resources" className="hover:text-purple-200">Resources</Link>
          <Link to="/profile" className="hover:text-purple-200">Profile</Link>
          {user && (
            <button onClick={handleLogout} className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
