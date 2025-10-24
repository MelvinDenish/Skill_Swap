import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { resourceAPI } from '../services/api';
import { ResourceItem } from '../types';

export default function Resources() {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [type, setType] = useState<'ALL' | 'PDF' | 'IMAGE' | 'LINK'>('ALL');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await resourceAPI.listAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter(r => {
      if (type !== 'ALL' && r.type !== type) return false;
      if (skill && (r.skillName || '').toLowerCase().indexOf(skill.toLowerCase()) === -1) return false;
      if (q) {
        const s = `${r.title || ''} ${r.description || ''} ${r.skillName || ''}`.toLowerCase();
        if (!s.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, q, skill, type]);

  const downloadUrl = (id: string) => resourceAPI.downloadUrl(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Community Resources</h1>
        <div className="bg-white p-4 rounded-xl shadow mb-6 grid md:grid-cols-4 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/description" className="border rounded p-2" />
          <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Filter by skill" className="border rounded p-2" />
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="border rounded p-2">
            <option value="ALL">All types</option>
            <option value="PDF">PDF</option>
            <option value="IMAGE">Image</option>
            <option value="LINK">Link</option>
          </select>
          <button onClick={load} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded disabled:opacity-60">{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-4">Title</th>
                <th className="py-2 px-4">Type</th>
                <th className="py-2 px-4">Skill</th>
                <th className="py-2 px-4">Added</th>
                <th className="py-2 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 px-4">{r.title || '(untitled)'}{r.description ? <div className="text-gray-500 text-xs">{r.description}</div> : null}</td>
                  <td className="py-2 px-4">{r.type}</td>
                  <td className="py-2 px-4">{r.skillName || '-'}</td>
                  <td className="py-2 px-4">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 space-x-2">
                    {r.type === 'LINK' ? (
                      <a href={r.url || '#'} target="_blank" className="text-blue-600 underline">Open</a>
                    ) : (
                      <a href={downloadUrl(r.id)} target="_blank" className="text-blue-600 underline">Download</a>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="py-6 px-4 text-center text-gray-500" colSpan={5}>No resources found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
