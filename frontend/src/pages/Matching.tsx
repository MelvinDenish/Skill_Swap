import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-white dark:text-gray-100 mb-10 text-center"
        >
          Find Your Perfect Skill Match ✨
        </motion.h1>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-white/30 dark:bg-neutral-800/40 animate-pulse rounded-2xl"
              ></div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-white/80 dark:text-gray-400 backdrop-blur-md bg-white/10 dark:bg-neutral-800/40 rounded-3xl max-w-lg mx-auto shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-2">No Matches Found</h2>
            <p>Add or update your skills to discover compatible learners!</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {matches.map((match, index) => (
              <motion.div
                key={match.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
