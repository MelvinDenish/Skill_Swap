import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, LogOut, User, Layers, Book, Users, Home } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggle } = useThemeStore();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/matching', label: 'Find Matches', icon: Users },
    { to: '/sessions', label: 'Sessions', icon: Layers },
    { to: '/groups', label: 'Groups', icon: User },
    { to: '/resources', label: 'Resources', icon: Book },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
        : 'text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
    }`;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-neutral-900/80 border-b border-gray-200 dark:border-neutral-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
        >
          SkillSwap
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-4 items-center">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}

          <button
            onClick={toggle}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-neutral-700 dark:hover:bg-neutral-800 transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-neutral-700 dark:hover:bg-neutral-800 text-sm transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm"
          >
            <div className="flex flex-col px-4 py-3 space-y-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" /> {label}
                </NavLink>
              ))}

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => {
                    toggle();
                    setOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 border border-gray-300 dark:border-neutral-700 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4" /> Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" /> Dark
                    </>
                  )}
                </button>

                {user && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 border border-gray-300 dark:border-neutral-700 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
