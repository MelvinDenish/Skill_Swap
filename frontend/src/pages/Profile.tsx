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
      const { data } = await userAPI.updateMe({ name, bio, profilePictureUrl, skillsOffered, skillsWanted, availability });
      if (token) setAuth(token, data);
      toast.success('Profile updated');
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
      toast.success('Uploaded');
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
      toast.success('Deleted');
      await loadResources();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const downloadUrl = (id: string) => resourceAPI.downloadUrl(id);

  const handleDownload = async (id: string, title?: string) => {
    try {
      const res = await resourceAPI.download(id);
      const blob = new Blob([res.data]);
      let filename = title || 'download';
      const cd = (res.headers as any)?.['content-disposition'] as string | undefined;
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
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-6 rounded-xl shadow">
            <img src={profilePictureUrl || '/default-avatar.svg'} alt={name} className="w-32 h-32 rounded-full mx-auto mb-3" />
            <div className="text-center font-semibold mb-4">{name}</div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{user?.points}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user?.level}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user?.rating.toFixed(1)}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user?.completedSessions}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Sessions</div>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-6 rounded-xl shadow space-y-5">
            <div>
              <label className="block font-semibold mb-2">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" rows={4} />
            </div>
            <div>
              <label className="block font-semibold mb-2">Profile picture URL</label>
              <input value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" placeholder="https://..." />
            </div>
            <div>
              <label className="block font-semibold mb-2">Availability</label>
              <input value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" placeholder="Weekdays 6-8 PM" />
            </div>
            <div>
              <label className="block font-semibold mb-2">Skills you can teach</label>
              <SkillChipInput skills={skillsOffered} onChange={setSkillsOffered} />
            </div>
            <div>
              <label className="block font-semibold mb-2">Skills you want to learn</label>
              <SkillChipInput skills={skillsWanted} onChange={setSkillsWanted} />
            </div>
            <button onClick={handleSave} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-6 rounded-xl shadow mt-8">
          <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication (TOTP)</h2>
          {!twoFASetup ? (
            <div>
              <button onClick={startTwoFASetup} className="bg-indigo-600 text-white px-4 py-2 rounded dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Start Setup</button>
              <div className="text-gray-600 dark:text-gray-400 text-sm mt-2">Use Google Authenticator or Authy.</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <div>
                <div className="font-semibold mb-2">Scan this QR</div>
                <img src={`${(import.meta.env as any)?.VITE_API_BASE_URL ?? '/api'}/2fa/setup/qr?secret=${encodeURIComponent(twoFASetup.secret)}&size=200`} alt="TOTP QR" className="border rounded" />
                <div className="text-xs text-gray-500 dark:text-gray-400 break-all mt-2">Secret: {twoFASetup.secret}</div>
              </div>
              <div>
                <label className="block font-semibold mb-2">Enter code from app</label>
                <input value={twoFAEnableCode} onChange={(e) => setTwoFAEnableCode(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" placeholder="123456" />
                <button onClick={enableTwoFA} className="mt-3 bg-green-600 text-white px-4 py-2 rounded">Enable 2FA</button>
              </div>
            </div>
          )}
          <div className="mt-4">
            <label className="block font-semibold mb-2">Disable 2FA</label>
            <div className="flex gap-2">
              <input value={twoFADisableCode} onChange={(e) => setTwoFADisableCode(e.target.value)} className="flex-1 border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" placeholder="Enter code" />
              <button onClick={disableTwoFA} className="bg-red-600 text-white px-4 py-2 rounded">Disable</button>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-6 rounded-xl shadow mt-8">
          <h2 className="text-2xl font-bold mb-4">My Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="font-semibold">Upload file</div>
              <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <input value={linkSkill} onChange={(e) => setLinkSkill(e.target.value)} placeholder="Skill name (optional)" className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" />
              <button disabled={uploading || !selectedFile} onClick={doUpload} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">{uploading ? 'Uploading...' : 'Upload'}</button>
            </div>
            <div className="space-y-3">
              <div className="font-semibold">Add link</div>
              <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Title" className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" />
              <input value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} placeholder="Description (optional)" className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" />
              <button onClick={createLink} className="bg-green-600 text-white px-4 py-2 rounded dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Add Link</button>
            </div>
          </div>
          <div className="mt-6 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b dark:border-neutral-800">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Skill</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(r => (
                  <tr key={r.id} className="border-b dark:border-neutral-800">
                    <td className="py-2 pr-4">{r.title || '(untitled)'}</td>
                    <td className="py-2 pr-4">{r.type}</td>
                    <td className="py-2 pr-4">{r.skillName || '-'}</td>
                    <td className="py-2 pr-4 space-x-2">
                      {r.type === 'LINK' ? (
                        <a href={r.url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a>
                      ) : (
                        <button onClick={() => handleDownload(r.id, r.title || 'resource')} className="btn-outline text-sm">Download</button>
                      )}
                      <button onClick={() => removeResource(r.id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar mappings */}
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-6 rounded-xl shadow mt-8">
          <h2 className="text-2xl font-bold mb-4">Calendar Sync</h2>
          {mappings.length === 0 ? (
            <div className="text-gray-600">No calendar mappings yet. They appear after confirming or creating sessions when an OAuth account is linked.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Session</th>
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Event ID</th>
                    <th className="py-2 pr-4">Link</th>
                    <th className="py-2 pr-4">Last Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m: any) => (
                    <tr key={m.id} className="border-b">
                      <td className="py-2 pr-4">{m.sessionId}</td>
                      <td className="py-2 pr-4">{m.provider}</td>
                      <td className="py-2 pr-4">{m.providerEventId}</td>
                      <td className="py-2 pr-4">{m.htmlLink ? <a href={m.htmlLink} target="_blank" className="text-blue-600 underline">Open</a> : '-'}</td>
                      <td className="py-2 pr-4">{m.lastSyncedAt ? new Date(m.lastSyncedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
