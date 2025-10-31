import { useEffect, useMemo, useRef, useState } from 'react';
import { chatAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { connectUserQueue, disconnectUserQueue } from '../../services/ws';

interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  messageText: string;
  isRead: boolean;
  createdAt?: string | null;
  readAt?: string | null;
}

export default function ChatPanel() {
  const { user, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return conversations;
    return conversations.filter(c => c.otherUserName?.toLowerCase().includes(f));
  }, [filter, conversations]);

  useEffect(() => {
    if (!open || !user || !token) return;
    chatAPI.conversations().then(({ data }) => setConversations(data || [])).catch(() => {});
    connectUserQueue(user.id, token, (payload) => {
      setMessages((prev) => [...prev, payload]);
      setConversations((prev) => prev.map(c => c.id === payload.conversationId ? { ...c, unreadCount: c.id === active?.id ? 0 : (c.unreadCount || 0) + 1, lastMessageTime: payload.createdAt || c.lastMessageTime } : c));
      scrollToBottom();
    });
    return () => disconnectUserQueue();
  }, [open, user?.id, token]);

  const openConv = async (c: Conversation) => {
    setActive(c);
    setMessages([]);
    setPage(0);
    setHasMore(true);
    await chatAPI.markRead(c.id).catch(() => {});
    await loadMore(c.id, 0, true);
    setConversations((prev) => prev.map(x => x.id === c.id ? { ...x, unreadCount: 0 } : x));
  };

  const loadMore = async (convId: string, p: number, replace = false) => {
    if (fetchingRef.current || (!hasMore && !replace)) return;
    fetchingRef.current = true;
    try {
      const { data } = await chatAPI.messages(convId, p, 20);
      const newItems: Message[] = (data?.content || []).reverse();
      setHasMore(!data?.last);
      setPage(p + 1);
      if (replace) setMessages(newItems);
      else setMessages((prev) => [...newItems, ...prev]);
      if (replace) scrollToBottom();
    } finally {
      fetchingRef.current = false;
    }
  };

  const onScroll = () => {
    const el = listRef.current;
    if (!el || fetchingRef.current || !active) return;
    if (el.scrollTop < 40 && hasMore) {
      loadMore(active.id, page);
    }
  };

  const send = async () => {
    if (!active || !text.trim()) return;
    const { data } = await chatAPI.send(active.id, text.trim());
    setMessages((prev) => [...prev, data]);
    setText('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => { try { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); } catch {} }, 30);
  };

  if (!user) return null;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 rounded-full shadow-lg p-3 text-white bg-gradient-to-br from-indigo-600 to-violet-600 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">💬</button>
      )}
      {open && (
        <div className="fixed bottom-5 left-5 z-40 w-[90vw] max-w-[1024px] h-[70vh] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden flex">
          <div className="w-72 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
            <div className="p-2">
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search" className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-2 py-1 text-sm" />
            </div>
            <div className="overflow-y-auto">
              {filtered.map((c) => (
                <button key={c.id} onClick={() => openConv(c)} className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-neutral-800 ${active?.id===c.id?'bg-gray-100 dark:bg-neutral-800':''}`}>
                  <div className="flex justify-between items-center text-sm">
                    <div className="font-medium">{c.otherUserName}</div>
                    {c.unreadCount > 0 && <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5">{c.unreadCount}</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleString() : ''}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="font-semibold">{active?.otherUserName || 'Select a conversation'}</div>
              <button onClick={() => setOpen(false)} className="text-sm opacity-80">✕</button>
            </div>
            <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-neutral-800">
              {active ? (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${m.senderId === user.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-900 text-gray-800 dark:text-neutral-100 border border-gray-200 dark:border-neutral-800'} rounded-lg px-3 py-2 max-w-[75%] whitespace-pre-wrap text-sm`}>
                      {m.messageText}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">Choose a conversation from the left</div>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-neutral-800 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder="Type a message..." className="flex-1 border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2 text-sm" />
              <button onClick={send} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded px-3 py-2 text-sm dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
