import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { resourceAPI } from '../services/api';
import { ResourceItem } from '../types';
import toast from 'react-hot-toast';
import { FileText, RefreshCw, Search } from 'lucide-react';

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
    } catch {
      toast.error('Failed to load resources');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-neutral-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Community Resources
          </h1>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:opacity-90 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 p-5 rounded-xl shadow-md grid md:grid-cols-4 gap-3 mb-8">
          <div className="flex items-center border border-gray-300 dark:border-neutral-700 rounded-lg px-2 bg-white/80 dark:bg-neutral-800/70">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or description"
              className="w-full bg-transparent p-2 text-gray-700 dark:text-neutral-100 focus:outline-none"
            />
          </div>
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Filter by skill"
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-white/80 dark:bg-neutral-800/70 text-gray-700 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-white/80 dark:bg-neutral-800/70 text-gray-700 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All types</option>
            <option value="PDF">PDF</option>
            <option value="IMAGE">Image</option>
            <option value="LINK">Link</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow overflow-hidden">
          <table className="min-w-full text-sm text-gray-700 dark:text-neutral-200">
            <thead className="bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-neutral-100">
              <tr>
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Skill</th>
                <th className="py-3 px-4">Added</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/70 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">
                    {r.title || '(untitled)'}
                    {r.description && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">{r.type}</td>
                  <td className="py-3 px-4 text-center">{r.skillName || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.type === 'LINK' ? (
                      <a
                        href={r.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                      >
                        Open
                      </a>
                    ) : (
                      <button
                        onClick={() => handleDownload(r.id, r.title || 'resource')}
                        className="px-3 py-1 border border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-neutral-800 transition"
                      >
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-500 dark:text-gray-400 italic"
                  >
                    No resources found. Try adjusting your filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading resources...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
