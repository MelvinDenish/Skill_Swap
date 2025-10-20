import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { leaderboardAPI } from '../services/api';
import toast from 'react-hot-toast';

interface LeaderboardItem {
  id: string;
  name: string;
  profilePictureUrl?: string;
  points: number;
  level: string;
  rating: number;
  completedSessions: number;
}

export default function Leaderboard() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await leaderboardAPI.getTop();
        setItems(data);
      } catch {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u, i) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-4">{i + 1}</td>
                    <td className="p-4 flex items-center gap-3">
                      <img src={u.profilePictureUrl || '/default-avatar.svg'} className="w-8 h-8 rounded-full" />
                      <span className="font-semibold">{u.name}</span>
                    </td>
                    <td className="p-4">{u.points}</td>
                    <td className="p-4">{u.level}</td>
                    <td className="p-4">{u.rating?.toFixed(1)}</td>
                    <td className="p-4">{u.completedSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
