import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sessionAPI, chatAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { connectUserQueue, disconnectUserQueue } from '../services/ws';

export default function SessionRoom() {
  const { id } = useParams();
  const { user, token } = useAuthStore();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [whiteboardUrl, setWhiteboardUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [convId, setConvId] = useState<string>('');
  const [partnerId, setPartnerId] = useState<string>('');
  const [partnerName, setPartnerName] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const [{ data: join }, { data: sessions }] = await Promise.all([
          sessionAPI.joinInfo(id),
          sessionAPI.getMySessions(),
        ]);
        if (!cancelled) {
          setVideoUrl(join.videoUrl);
          setWhiteboardUrl(join.whiteboardUrl);
          const s = (sessions || []).find((x: any) => x.id === id);
          if (s) {
            const otherId = s.partnerId;
            setPartnerId(otherId);
            setPartnerName(s.partnerName);
            const { data: conv } = await chatAPI.start(otherId);
            setConvId(conv.id);
            const { data: page } = await chatAPI.messages(conv.id, 0, 20);
            setMessages((page?.content || []).reverse());
            scrollToBottom();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!user || !token) return;
    connectUserQueue(user.id, token, (payload) => {
      if (payload?.conversationId === convId) {
        setMessages((prev) => [...prev, payload]);
        scrollToBottom();
      }
    });
    return () => disconnectUserQueue();
  }, [user?.id, token, convId]);

  const send = async () => {
    if (!convId || !text.trim()) return;
    const { data } = await chatAPI.send(convId, text.trim());
    setMessages((prev) => [...prev, data]);
    setText('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => { try { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); } catch {} }, 30);
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="container mx-auto p-4">
      <div className="mb-2 text-sm text-gray-600">Session with {partnerName}</div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3">
          <div className="aspect-video bg-black rounded overflow-hidden">
            {videoUrl && (
              <iframe src={videoUrl} title="Video" className="w-full h-full" allow="camera; microphone; display-capture; autoplay; clipboard-read; clipboard-write"></iframe>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="aspect-video bg-white dark:bg-neutral-900 rounded overflow-hidden border dark:border-neutral-800">
            {whiteboardUrl && (
              <iframe src={whiteboardUrl} title="Whiteboard" className="w-full h-full"></iframe>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 border dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 font-medium">Inline Chat</div>
        <div ref={listRef} className="h-48 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-neutral-900">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-900 dark:text-neutral-100'} border dark:border-neutral-800 rounded px-3 py-2 max-w-[75%] text-sm` }>
                {m.messageText}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t dark:border-neutral-800">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder="Type a message..." className="flex-1 border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2 text-sm" />
          <button onClick={send} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded px-3 py-2 text-sm dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Send</button>
        </div>
      </div>
    </div>
    </div>
  );
}
