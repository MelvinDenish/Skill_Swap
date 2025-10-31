import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { resourceAPI } from '../services/api';
import { ResourceItem } from '../types';
import toast from 'react-hot-toast';

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Community Resources</h1>
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-4 rounded-xl shadow mb-6 grid md:grid-cols-4 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/description" className="border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" />
          <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Filter by skill" className="border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2" />
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded p-2">
            <option value="ALL">All types</option>
            <option value="PDF">PDF</option>
            <option value="IMAGE">Image</option>
            <option value="LINK">Link</option>
          </select>
          <button onClick={load} disabled={loading} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2 rounded disabled:opacity-60 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">{loading ? 'Refreshing...' : 'Refresh'}</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b dark:border-neutral-800">
                <th className="py-2 px-4">Title</th>
                <th className="py-2 px-4">Type</th>
                <th className="py-2 px-4">Skill</th>
                <th className="py-2 px-4">Added</th>
                <th className="py-2 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b dark:border-neutral-800">
                  <td className="py-2 px-4">{r.title || '(untitled)'}{r.description ? <div className="text-gray-500 dark:text-gray-400 text-xs">{r.description}</div> : null}</td>
                  <td className="py-2 px-4">{r.type}</td>
                  <td className="py-2 px-4">{r.skillName || '-'}</td>
                  <td className="py-2 px-4">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 space-x-2">
                    {r.type === 'LINK' ? (
                      <a href={r.url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open</a>
                    ) : (
                      <button onClick={() => handleDownload(r.id, r.title || 'resource')} className="btn-outline text-sm">Download</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="py-6 px-4 text-center text-gray-500 dark:text-gray-400" colSpan={5}>No resources found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
