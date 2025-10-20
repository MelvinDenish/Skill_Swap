import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import SkillChipInput from '../components/SkillChipInput';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setAuth, token } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '');
  const [skillsOffered, setSkillsOffered] = useState<string[]>(user?.skillsOffered || []);
  const [skillsWanted, setSkillsWanted] = useState<string[]>(user?.skillsWanted || []);
  const [availability, setAvailability] = useState(user?.availability || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio || '');
    setProfilePictureUrl(user.profilePictureUrl || '');
    setSkillsOffered(user.skillsOffered || []);
    setSkillsWanted(user.skillsWanted || []);
    setAvailability(user.availability || '');
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await userAPI.updateMe({ name, bio, profilePictureUrl, skillsOffered, skillsWanted, availability });
      if (token) setAuth(token, data);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e?.response?.data || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow">
            <img src={profilePictureUrl || '/default-avatar.svg'} alt={name} className="w-32 h-32 rounded-full mx-auto mb-3" />
            <div className="text-center font-semibold mb-4">{name}</div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{user?.points}</div>
                <div className="text-gray-500 text-sm">Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user?.level}</div>
                <div className="text-gray-500 text-sm">Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user?.rating.toFixed(1)}</div>
                <div className="text-gray-500 text-sm">Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user?.completedSessions}</div>
                <div className="text-gray-500 text-sm">Sessions</div>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow space-y-5">
            <div>
              <label className="block font-semibold mb-2">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full border rounded p-2" rows={4} />
            </div>
            <div>
              <label className="block font-semibold mb-2">Profile picture URL</label>
              <input value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} className="w-full border rounded p-2" placeholder="https://..." />
            </div>
            <div>
              <label className="block font-semibold mb-2">Availability</label>
              <input value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full border rounded p-2" placeholder="Weekdays 6-8 PM" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Skills you can teach</label>
              <SkillChipInput skills={skillsOffered} onChange={setSkillsOffered} />
            </div>
            <div>
              <label className="block font-semibold mb-2">Skills you want to learn</label>
              <SkillChipInput skills={skillsWanted} onChange={setSkillsWanted} />
            </div>
            <button onClick={handleSave} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
