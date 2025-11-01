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

  const refreshMe = async () => {
    try {
      const { data } = await userAPI.getMe();
      if (token) setAuth(token, data);
    } catch {}
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
      await refreshMe();
    } catch {
      toast.error('Invalid code');
    }
  };

  const disableTwoFA = async () => {
    try {
      await twoFAAPI.disable(twoFADisableCode);
      toast.success('Two-factor authentication disabled');
      setTwoFADisableCode('');
      await refreshMe();
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
          <div>
            <label className="block font-semibold mb-2">Profile Picture URL</label>
            <input value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} placeholder="https://..." className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
          </div>
          <button onClick={handleSave} disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-60">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </section>

        {/* Two-Factor Authentication */}
        <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Two-Factor Authentication (2FA)</h2>
            <span className={`text-sm px-2 py-1 rounded ${((user as any)?.twoFactorEnabled ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-300')}`}>
              {((user as any)?.twoFactorEnabled ? 'Enabled' : 'Disabled')}
            </span>
          </div>

          {((user as any)?.twoFactorEnabled) ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Enter a valid 2FA code from your authenticator app to disable 2FA.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={twoFADisableCode} onChange={(e) => setTwoFADisableCode(e.target.value)} placeholder="6-digit code" className="flex-1 border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
                <button onClick={disableTwoFA} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90">Disable 2FA</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!twoFASetup ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account.</p>
                  <button onClick={startTwoFASetup} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:opacity-90">Start 2FA setup</button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Scan this QR code with Google Authenticator, 1Password, or Authy:</p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(twoFASetup.url)}`}
                      alt="2FA QR Code"
                      className="w-56 h-56 rounded-lg bg-white p-3 shadow"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-all">Or use secret: <span className="font-mono">{twoFASetup.secret}</span></p>
                  </div>
                  <div className="space-y-3">
                    <label className="block font-semibold mb-1">Enter 6-digit code to enable</label>
                    <input value={twoFAEnableCode} onChange={(e) => setTwoFAEnableCode(e.target.value)} placeholder="6-digit code" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
                    <button onClick={enableTwoFA} className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:opacity-90">Enable 2FA</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Resources */}
        <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-md space-y-6">
          <h2 className="text-2xl font-bold">Your Resources</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Upload a file</h3>
              <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full" />
              <input value={linkSkill} onChange={(e) => setLinkSkill(e.target.value)} placeholder="Skill (optional)" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
              <button onClick={doUpload} disabled={!selectedFile || uploading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:opacity-90 disabled:opacity-60">
                {uploading ? 'Uploading...' : selectedFile ? `Upload ${selectedFile.name}` : 'Choose a file'}
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Add a link</h3>
              <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Title" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com/resource" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
              <textarea value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
              <input value={linkSkill} onChange={(e) => setLinkSkill(e.target.value)} placeholder="Skill (optional)" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50" />
              <button onClick={createLink} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:opacity-90">Add Link</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b dark:border-neutral-800">
                  <th className="py-2">Title</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Skill</th>
                  <th className="py-2">Size</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(r => (
                  <tr key={r.id} className="border-b last:border-0 dark:border-neutral-800">
                    <td className="py-2 pr-3">{r.title || (r.type === 'LINK' ? (r.url || 'Link') : 'File')}</td>
                    <td className="py-2 pr-3">{r.type}</td>
                    <td className="py-2 pr-3">{r.skillName || '-'}</td>
                    <td className="py-2 pr-3">{r.sizeBytes ? `${(r.sizeBytes / 1024).toFixed(1)} KB` : '-'}</td>
                    <td className="py-2 flex gap-2">
                      {r.type !== 'LINK' && (
                        <button onClick={() => handleDownload(r.id, r.title || undefined)} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800">Download</button>
                      )}
                      <button onClick={() => removeResource(r.id)} className="px-2 py-1 rounded bg-red-500 text-white">Delete</button>
                    </td>
                  </tr>
                ))}
                {resources.length === 0 && (
                  <tr><td className="py-4 text-gray-500 dark:text-gray-400" colSpan={5}>No resources yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Calendar */}
        <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-md space-y-6">
          <h2 className="text-2xl font-bold">Your Calendar Mappings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b dark:border-neutral-800">
                  <th className="py-2">Service</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(m => (
                  <tr key={m.id} className="border-b last:border-0 dark:border-neutral-800">
                    <td className="py-2 pr-3">{m.serviceName}</td>
                    <td className="py-2 pr-3">
                      <span className={`text-sm px-2 py-1 rounded ${m.status === 'Connected' ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2 flex gap-2">
                      {m.status === 'Disconnected' && (
                        <button onClick={() => loadMappings()} className="px-2 py-1 rounded bg-indigo-600 text-white hover:opacity-90">Reconnect</button>
                      )}
                      {m.status === 'Connected' && (
                        <button onClick={() => loadMappings()} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800">Refresh</button>
                      )}
                    </td>
                  </tr>
                ))}
                {mappings.length === 0 && (
                  <tr><td className="py-4 text-gray-500 dark:text-gray-400" colSpan={3}>No calendar mappings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
