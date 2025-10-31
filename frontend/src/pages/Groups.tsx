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
  const [form, setForm] = useState({ name: '', description: '', relatedSkill: '', maxMembers: 10, isPrivate: false });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await groupsAPI.list(skill || undefined, 0, 20);
      setItems(data?.content ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    const { data } = await groupsAPI.create(form);
    setItems((prev) => [data, ...prev.filter(g => g.id !== data.id)]);
    setShowCreate(false);
    setForm({ name: '', description: '', relatedSkill: '', maxMembers: 10, isPrivate: false });
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Study Groups</h1>
        <div className="flex gap-2">
          <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Filter by skill" className="border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-1"/>
          <button onClick={load} className="px-3 py-1 bg-gray-200 dark:bg-neutral-800 rounded">Search</button>
          {user && (
            <button onClick={() => setShowCreate(true)} className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Create Group</button>
          )}
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(g => (
            <Link key={g.id} to={`/groups/${g.id}`} className="border dark:border-neutral-800 rounded-lg p-4 hover:shadow dark:bg-neutral-900">
              <div className="font-semibold text-lg">{g.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{g.relatedSkill}</div>
              <div className="mt-2 text-sm line-clamp-3">{g.description}</div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Members: {g.memberCount}/{g.maxMembers}</div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg p-4 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-2">Create Group</h2>
            <div className="space-y-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2" />
              <input value={form.relatedSkill} onChange={(e) => setForm({ ...form, relatedSkill: e.target.value })} placeholder="Related Skill" className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2" />
              <div className="flex gap-2">
                <input type="number" min={3} max={30} value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: Number(e.target.value) })} className="w-24 border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
                  Private
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-3 py-2">Cancel</button>
                <button onClick={create} className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
