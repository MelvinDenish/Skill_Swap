import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { groupsAPI } from '../services/api';
import Navbar from '../components/Navbar';

export default function Groups() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [skill, setSkill] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    relatedSkill: '',
    maxMembers: 10,
    isPrivate: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await groupsAPI.list(skill || undefined, 0, 20);
      setItems(data?.content ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    const { data } = await groupsAPI.create(form);
    setItems((prev) => [data, ...prev.filter((g) => g.id !== data.id)]);
    setShowCreate(false);
    setForm({ name: '', description: '', relatedSkill: '', maxMembers: 10, isPrivate: false });
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-neutral-950 dark:to-neutral-900 transition-colors">
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Study Groups
          </h1>
          <div className="flex gap-2">
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Search by skill..."
              className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <button
              onClick={load}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow-sm hover:opacity-90 transition"
            >
              Search
            </button>
            {user && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow-sm hover:opacity-90 transition"
              >
                + Create
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">Loading groups...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">No groups found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((g) => (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="p-5 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-500 transition-all bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm"
              >
                <div className="font-semibold text-lg text-gray-900 dark:text-neutral-100">
                  {g.name}
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                  {g.relatedSkill}
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {g.description || 'No description provided.'}
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  👥 {g.memberCount}/{g.maxMembers} members
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-neutral-100">
                Create a New Group
              </h2>
              <div className="space-y-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Group name"
                  className="w-full border dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description"
                  className="w-full border dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  value={form.relatedSkill}
                  onChange={(e) => setForm({ ...form, relatedSkill: e.target.value })}
                  placeholder="Related skill"
                  className="w-full border dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={form.maxMembers}
                    onChange={(e) => setForm({ ...form, maxMembers: Number(e.target.value) })}
                    className="w-24 border dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 rounded-lg px-3 py-2"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.isPrivate}
                      onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                    />
                    Private Group
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-lg border dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={create}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow hover:opacity-90 transition"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
