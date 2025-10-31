import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { sessionAPI, matchAPI } from '../services/api';
import { Session, Match } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [sessionsRes, matchesRes] = await Promise.all([
        sessionAPI.getMySessions(),
        matchAPI.getMatches()
      ]);
      setSessions(sessionsRes.data.filter((s: Session) => s.status !== 'COMPLETED').slice(0, 3));
      setMatches(matchesRes.data.slice(0, 3));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:bg-none dark:bg-neutral-900 text-white rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <div className="flex gap-8 mt-4">
            <div>
              <div className="text-3xl font-bold">{user?.points}</div>
              <div className="text-indigo-200">Points</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{user?.level}</div>
              <div className="text-indigo-200">Level</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{user?.rating.toFixed(1)} ⭐</div>
              <div className="text-indigo-200">Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{user?.completedSessions}</div>
              <div className="text-indigo-200">Sessions</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Upcoming Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No upcoming sessions</p>
            ) : (
              sessions.map(session => (
                <div key={session.id} className="border-b dark:border-neutral-800 py-3">
                  <div className="font-semibold">{session.skillTopic}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">with {session.partnerName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(session.scheduledTime).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Top Matches</h2>
            {matches.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No matches yet. Complete your profile!</p>
            ) : (
              matches.map(match => (
                <div key={match.userId} className="border-b dark:border-neutral-800 py-3 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{match.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Match: {match.matchScore}%</div>
                  </div>
                  <button onClick={() => navigate(`/user/${match.userId}`)} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1 rounded-lg text-sm hover:opacity-90 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">
                    Connect
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
