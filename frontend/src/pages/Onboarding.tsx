import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import SkillChipInput from '../components/SkillChipInput';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setAuth, token } = useAuthStore();
  const [skillsOffered, setSkillsOffered] = useState<string[]>(user?.skillsOffered || []);
  const [skillsWanted, setSkillsWanted] = useState<string[]>(user?.skillsWanted || []);
  const [availability, setAvailability] = useState(user?.availability || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (skillsOffered.length === 0 || skillsWanted.length === 0) {
      toast.error('Please add at least one skill in each section');
      return;
    }
    setSaving(true);
    try {
      const { data } = await userAPI.updateMe({ skillsOffered, skillsWanted, availability });
      if (token) setAuth(token, data);
      toast.success('Profile updated successfully! 🎉');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/20 backdrop-blur-xl dark:bg-neutral-900/70 dark:border dark:border-neutral-800 text-white rounded-3xl shadow-2xl p-8 w-full max-w-3xl space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-extrabold mb-2">Complete Your Profile 🌟</h1>
            <p className="text-white/80 dark:text-gray-400 text-sm">
              Add your skills and availability so we can match you with the perfect learning partners.
            </p>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <label className="block font-semibold mb-2 text-white">Skills You Can Teach</label>
              <SkillChipInput
                skills={skillsOffered}
                onChange={setSkillsOffered}
                placeholder="e.g., Java, UI Design, Marketing"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <label className="block font-semibold mb-2 text-white">Skills You Want to Learn</label>
              <SkillChipInput
                skills={skillsWanted}
                onChange={setSkillsWanted}
                placeholder="e.g., React, AWS, Data Analysis"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <label className="block font-semibold mb-2 text-white">Availability</label>
              <input
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full border border-white/30 dark:border-neutral-700 bg-white/10 dark:bg-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 placeholder:text-white/60"
                placeholder="e.g., Weekdays 6–8 PM"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  saving
                    ? 'bg-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90 shadow-lg'
                }`}
              >
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
