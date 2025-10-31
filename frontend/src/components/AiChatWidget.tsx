import { useEffect, useMemo, useRef, useState } from 'react';
import { aiAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Message {
  id?: string;
  role: 'user' | 'ai';
  text: string;
  skill?: string;
  createdAt?: string;
}

const cacheKey = (uid: string) => `ai_widget_cache_${uid}`;

export default function AiChatWidget() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [skill, setSkill] = useState<string>('General');
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const skills = useMemo(() => {
    const set = new Set<string>();
    set.add('General');
    try {
      user?.skillsWanted?.forEach((s: string) => set.add(s));
      user?.skillsOffered?.forEach((s: string) => set.add(s));
    } catch {}
    return Array.from(set);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(cacheKey(user.id));
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(cacheKey(user.id), JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages, user?.id]);

  useEffect(() => {
    if (open && messages.length === 0 && user) {
      // Prefetch history
      aiAPI.history(0, 20).then(({ data }) => {
        const hist: Message[] = (data || []).reverse().map((m: any) => ({
          id: m.id,
          role: 'ai',
          text: `Q: ${m.question}\n\n${m.answer}`,
          skill: m.skill,
          createdAt: m.createdAt,
        }));
        setMessages(hist);
      }).catch(() => {});
    }
  }, [open, user]);

  const send = async () => {
    if (!input.trim() || loading) return;
    setError(null);
    const userMsg: Message = { role: 'user', text: input.trim(), skill: skill === 'General' ? undefined : skill };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await aiAPI.ask(userMsg.text, userMsg.skill ?? undefined);
      const aiMsg: Message = { id: data.id, role: 'ai', text: data.answer, skill: (data.skill ?? undefined), createdAt: data.createdAt };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to get AI response';
      setError(msg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          aria-label="Open AI Assistant"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 rounded-full shadow-lg p-4 text-white bg-gradient-to-br from-indigo-600 to-violet-600 hover:opacity-90 transition-transform transform hover:scale-105 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700"
        >
          <span className="text-2xl">💡</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-96 max-w-[95vw] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white dark:bg-none dark:bg-neutral-800 dark:text-neutral-100 dark:border-b dark:border-neutral-800">
            <div className="font-semibold">Quick Help Assistant</div>
            <button onClick={() => setOpen(false)} className="opacity-90 hover:opacity-100">✕</button>
          </div>

          <div className="px-3 py-2 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Skill</label>
            <select value={skill} onChange={(e) => setSkill(e.target.value)} className="flex-1 text-sm border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-2 py-1">
              {skills.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="h-72 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50 dark:bg-neutral-800">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-100 border border-gray-200 dark:border-neutral-800'} rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap text-sm`}> 
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  </span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-red-600">{error}</div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask a quick question..."
              className="flex-1 border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2 text-sm"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700"
            >Send</button>
          </div>
        </div>
      )}
    </>
  );
}
