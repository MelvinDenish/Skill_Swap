import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import SkillChipInput from '../components/SkillChipInput';
import { useAuthStore } from '../store/authStore';
import { userAPI, twoFAAPI, resourceAPI, calendarAPI } from '../services/api';
import { ResourceItem } from '../types';
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

  // 2FA
  const [twoFASetup, setTwoFASetup] = useState<{ secret: string; url: string } | null>(null);
  const [twoFAEnableCode, setTwoFAEnableCode] = useState('');
  const [twoFADisableCode, setTwoFADisableCode] = useState('');

  // Resources
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [linkSkill, setLinkSkill] = useState('');

  // Calendar mappings
  const [mappings, setMappings] = useState<any[]>([]);

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
      const { data } = await userAPI.updateMe({
        name, bio, profilePictureUrl, skillsOffered, skillsWanted, availability,
      });
      if (token) setAuth(token, data);
      toast.success('Profile updated successfully');
    } catch (e: any) {
      toast.error(e?.response?.data || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const startTwoFASetup = async () => {
    try {
      const { data } = await twoFAAPI.setup();
      setTwoFASetup(data);
    } catch {
      toast.error('Failed to start 2FA setup');
    }
  };

  const enableTwoFA = async () => {
    if (!twoFASetup) return;
    try {
      await twoFAAPI.enable(twoFASetup.secret, twoFAEnableCode);
      toast.success('Two-factor authentication enabled');
      setTwoFASetup(null);
      setTwoFAEnableCode('');
    } catch {
      toast.error('Invalid code');
    }
  };

  const disableTwoFA = async () => {
    try {
      await twoFAAPI.disable(twoFADisableCode);
      toast.success('Two-factor authentication disabled');
      setTwoFADisableCode('');
    } catch {
      toast.error('Failed to disable');
    }
  };

  const loadResources = async () => {
    try {
      const { data } = await resourceAPI.my();
      setResources(data);
    } catch {}
  };

  useEffect(() => { loadResources(); }, []);

  const doUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await resourceAPI.upload(selectedFile, undefined, linkSkill || undefined);
      toast.success('File uploaded');
      setSelectedFile(null);
      await loadResources();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const createLink = async () => {
    if (!linkTitle || !linkUrl) {
      toast.error('Title and URL are required');
      return;
    }
    try {
      await resourceAPI.link({ title: linkTitle, url: linkUrl, description: linkDesc || undefined, skillName: linkSkill || undefined });
      toast.success('Link added');
      setLinkTitle(''); setLinkUrl(''); setLinkDesc('');
      await loadResources();
    } catch {
      toast.error('Failed to add link');
    }
  };

  const removeResource = async (id: string) => {
    try {
      await resourceAPI.remove(id);
      toast.success('Resource deleted');
      await loadResources();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDownload = async (id: string, title?: string) => {
    try {
      const res = await resourceAPI.download(id);
      const blob = new Blob([res.data]);
      let filename = title || 'download';
      const cd = (res.headers as any)?.['content-disposition'];
      if (cd) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
        if (match) filename = decodeURIComponent(match[1] || match[2]);
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const loadMappings = async () => {
    try {
      const { data } = await calendarAPI.myMappings();
      setMappings(data);
    } catch {}
  };
  useEffect(() => { loadMappings(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">

        {/* Profile Header */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-md flex flex-col md:flex-row gap-6 items-center">
          <img src={profilePictureUrl || '/default-avatar.svg'} alt={name} className="w-32 h-32 rounded-full object-cover shadow-md" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold">{name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{bio || 'No bio yet'}</p>
            <div className="mt-4 flex justify-center md:justify-start gap-6 text-sm">
              <span><strong>{user?.points}</strong> Points</span>
              <span><strong>{user?.level}</strong> Level</span>
              <span><strong>{user?.rating?.toFixed(1)}</strong> ★ Rating</span>
              <span><strong>{user?.completedSessions}</strong> Sessions</span>
            </div>
          </div>
        </div>

        {/* Profile Edit */}
        <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-md space-y-5">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Edit Profile</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold mb-2">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Availability</label>
              <input value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-2">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" rows={3} />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold mb-2">Skills You Can Teach</label>
              <SkillChipInput skills={skillsOffered} onChange={setSkillsOffered} />
            </div>
            <div>
              <label className="block font-semibold mb-2">Skills You Want to Learn</label>
              <SkillChipInput skills={skillsWanted} onChange={setSkillsWanted} />
            </div>
          </div>
          <button onClick={handleSave} disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </section>

        {/* Two-Factor Auth, Resources, Calendar sections */}
        {/* ...keep your same logic, but wrap each in cards like above for visual consistency */}
      </div>
    </div>
  );
}
