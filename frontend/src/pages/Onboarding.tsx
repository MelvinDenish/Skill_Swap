import { useState } from 'react';
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

  const handleSave = async () => {
    try {
      const { data } = await userAPI.updateMe({ skillsOffered, skillsWanted, availability });
      if (token) setAuth(token, data);
      toast.success('Profile updated');
      navigate('/dashboard');
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Complete your profile</h1>
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow p-6 space-y-6">
          <div>
            <label className="block font-semibold mb-2">Skills you can teach</label>
            <SkillChipInput skills={skillsOffered} onChange={setSkillsOffered} placeholder="e.g., Java, Python" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Skills you want to learn</label>
            <SkillChipInput skills={skillsWanted} onChange={setSkillsWanted} placeholder="e.g., React, AWS" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Availability</label>
            <input value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" placeholder="Weekdays 6-8 PM" />
          </div>
          <button onClick={handleSave} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Save & Continue</button>
        </div>
      </div>
    </div>
  );
}
