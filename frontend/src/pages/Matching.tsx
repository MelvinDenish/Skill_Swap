import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import { matchAPI } from '../services/api';
import { Match } from '../types';
import toast from 'react-hot-toast';

export default function Matching() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data } = await matchAPI.getMatches();
      setMatches(data);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Find Your Perfect Skill Match</h1>
        {loading ? (
          <div className="text-center py-12">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No matches found. Make sure you've added skills to your profile!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard key={match.userId} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
