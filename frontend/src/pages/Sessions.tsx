import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { sessionAPI } from '../services/api';
import { Session } from '../types';
import SessionCard from '../components/SessionCard';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await sessionAPI.getMySessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'ALL') return sessions;
    return sessions.filter((s) => s.status === tab);
  }, [sessions, tab]);

  const handleAction = async (id: string, status: Session['status']) => {
    try {
      await sessionAPI.updateStatus(id, status);
      toast.success('Updated successfully');
      await load();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100"
        >
          Your Sessions
        </motion.h1>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow'
                    : 'bg-transparent border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60'
                }`}
              >
                {t}
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-neutral-600 dark:text-neutral-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading sessions...
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-neutral-500 dark:text-neutral-400"
          >
            No sessions found for this category.
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4"
          >
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <SessionCard
                  session={s}
                  onAction={(action) =>
                    handleAction(s.id, action as Session['status'])
                  }
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
