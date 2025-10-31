import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { sessionAPI } from '../services/api';
import { Session } from '../types';
import SessionCard from '../components/SessionCard';
import toast from 'react-hot-toast';

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<'ALL'|'PENDING'|'CONFIRMED'|'COMPLETED'|'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await sessionAPI.getMySessions();
      setSessions(data);
    } catch (e) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (tab === 'ALL') return sessions;
    return sessions.filter(s => s.status === tab);
  }, [sessions, tab]);

  const handleAction = async (id: string, status: Session['status']) => {
    try {
      await sessionAPI.updateStatus(id, status);
      toast.success('Updated');
      await load();
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Sessions</h1>
        <div className="flex gap-2 mb-6">
          {(['ALL','PENDING','CONFIRMED','COMPLETED','CANCELLED'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`${tab===t? 'btn' : 'btn-outline'} rounded-full text-sm`}>{t}</button>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">No sessions</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(s => (
              <SessionCard key={s.id} session={s} onAction={(action) => handleAction(s.id, action as Session['status'])} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
