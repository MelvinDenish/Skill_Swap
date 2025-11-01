import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";
import { sessionAPI, matchAPI } from "../services/api";
import { Session, Match } from "../types";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
        matchAPI.getMatches(),
      ]);
      setSessions(
        sessionsRes.data
          .filter((s: Session) => s.status !== "COMPLETED")
          .slice(0, 3)
      );
      setMatches(matchesRes.data.slice(0, 3));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 transition-colors">
      <Navbar />

      <div className="container mx-auto px-6 py-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-neutral-800 dark:to-neutral-800 text-white rounded-3xl p-10 mb-10 shadow-xl"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Welcome back, {user?.name}! 👋
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
            {[
              { label: "Points", value: user?.points },
              { label: "Level", value: user?.level },
              { label: "Rating", value: `${user?.rating.toFixed(1)} ⭐` },
              { label: "Sessions", value: user?.completedSessions },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 shadow-md"
              >
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-indigo-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sessions & Matches */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
          >
            <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-100">
              Upcoming Sessions
            </h2>
            {sessions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No upcoming sessions
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="border-b border-gray-100 dark:border-neutral-800 py-3"
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {session.skillTopic}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    with {session.partnerName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(session.scheduledTime).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </motion.div>

          {/* Top Matches */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
          >
            <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-100">
              Top Matches
            </h2>
            {matches.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No matches yet. Complete your profile!
              </p>
            ) : (
              matches.map((match) => (
                <div
                  key={match.userId}
                  className="border-b border-gray-100 dark:border-neutral-800 py-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {match.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Match: {match.matchScore}%
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/user/${match.userId}`)}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:shadow-md hover:opacity-95 transition-all"
                  >
                    Connect
                  </motion.button>
                </div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
