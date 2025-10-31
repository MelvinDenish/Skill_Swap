import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200 text-gray-700 dark:bg-neutral-900/80 dark:text-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="text-2xl font-bold logo" aria-label="Go to dashboard">
          <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">SkillSwap</span>
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          <NavLink to="/dashboard" className={({isActive}) => `px-2 py-1 rounded-md transition-colors ${isActive ? 'text-brand bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/matching" className={({isActive}) => `px-2 py-1 rounded-md transition-colors ${isActive ? 'text-brand bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} nav-link ${isActive ? 'active' : ''}`}>Find Matches</NavLink>
          <NavLink to="/sessions" className={({isActive}) => `px-2 py-1 rounded-md transition-colors ${isActive ? 'text-brand bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} nav-link ${isActive ? 'active' : ''}`}>Sessions</NavLink>
          <NavLink to="/groups" className={({isActive}) => `px-2 py-1 rounded-md transition-colors ${isActive ? 'text-brand bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} nav-link ${isActive ? 'active' : ''}`}>Groups</NavLink>
          <NavLink to="/resources" className={({isActive}) => `px-2 py-1 rounded-md transition-colors ${isActive ? 'text-brand bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} nav-link ${isActive ? 'active' : ''}`}>Resources</NavLink>
          <NavLink to="/profile" className={({isActive}) => `px-2 py-1 rounded-md transition-colors ${isActive ? 'text-brand bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
          <button onClick={toggle} className="px-3 py-1 rounded-lg text-sm border border-gray-300 hover:bg-gray-100 btn-outline dark:border-0">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          {user && (
            <button onClick={handleLogout} className="px-3 py-1 rounded-lg text-sm text-gray-700 border border-gray-300 hover:bg-gray-100 btn-ghost dark:border-0">
              Logout
            </button>
          )}
        </div>
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">Open main menu</span>
          ☰
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 dark:border-neutral-800 px-4 pb-4">
          <div className="flex flex-col gap-2 pt-2">
            <NavLink to="/dashboard" onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
            <NavLink to="/matching" onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Find Matches</NavLink>
            <NavLink to="/sessions" onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Sessions</NavLink>
            <NavLink to="/groups" onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Groups</NavLink>
            <NavLink to="/resources" onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Resources</NavLink>
            <NavLink to="/profile" onClick={() => setOpen(false)} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { toggle(); setOpen(false); }} className="px-3 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-100 w-full btn-outline dark:border-0">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              {user && (
                <button onClick={() => { handleLogout(); setOpen(false); }} className="px-3 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-100 w-full btn-ghost dark:border-0">
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
