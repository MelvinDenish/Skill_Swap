import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-32 left-20 w-64 h-64 bg-brand/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-32 right-20 w-72 h-72 bg-accent/30 rounded-full blur-3xl animate-pulse"></div>

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center px-6 md:px-12 py-16 max-w-4xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent animate-text-glow">
            SkillSwap
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Exchange knowledge, grow your skills, and connect with peers who can
          teach what you want to learn.
        </p>

        <div className="flex flex-wrap gap-5 justify-center mt-8">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-lg font-semibold text-white bg-gradient-to-r from-brand to-accent shadow-lg shadow-accent/30 hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand transition-all duration-300"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
            >
              Login
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Animated subtle background gradient glow */}
      <style>
        {`
          @keyframes text-glow {
            0%, 100% { filter: drop-shadow(0 0 8px rgba(59,130,246,0.5)); }
            50% { filter: drop-shadow(0 0 16px rgba(236,72,153,0.6)); }
          }
          .animate-text-glow {
            animation: text-glow 3s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}
