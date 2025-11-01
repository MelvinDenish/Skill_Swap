import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sessionAPI, chatAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { connectUserQueue, disconnectUserQueue } from '../services/ws';
import { motion } from 'framer-motion';
import { SendHorizonal, Loader2 } from 'lucide-react';

export default function SessionRoom() {
  const { id } = useParams();
  const { user, token } = useAuthStore();
  const [videoUrl, setVideoUrl] = useState('');
  const [whiteboardUrl, setWhiteboardUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [convId, setConvId] = useState('');
  const [partnerName, setPartnerName] = useState('');
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
            setPartnerName(s.partnerName);
            const { data: conv } = await chatAPI.start(s.partnerId);
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
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 50);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-700 dark:text-neutral-200">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading your session...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="container mx-auto p-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-lg font-semibold text-indigo-600 dark:text-indigo-400"
        >
          Session with {partnerName || 'Participant'}
        </motion.div>

        {/* Session Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-black rounded-xl overflow-hidden shadow-lg"
          >
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title="Video"
                className="w-full aspect-video"
                allow="camera; microphone; display-capture; autoplay; clipboard-read; clipboard-write"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 p-6">
                Waiting for video session...
              </div>
            )}
          </motion.div>

          {/* Whiteboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow border dark:border-neutral-800"
          >
            {whiteboardUrl ? (
              <iframe
                src={whiteboardUrl}
                title="Whiteboard"
                className="w-full aspect-video"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 p-6">
                Whiteboard loading...
              </div>
            )}
          </motion.div>
        </div>

        {/* Chat Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 border dark:border-neutral-800 rounded-xl shadow overflow-hidden"
        >
          <div className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-sm font-medium border-b dark:border-neutral-700">
            Inline Chat
          </div>

          <div
            ref={listRef}
            className="h-64 overflow-y-auto p-4 space-y-2 bg-white dark:bg-neutral-900"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.senderId === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <motion.div
                  layout
                  className={`px-3 py-2 rounded-2xl text-sm max-w-[75%] shadow-sm ${
                    m.senderId === user?.id
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-neutral-800 border dark:border-neutral-700'
                  }`}
                >
                  {m.messageText}
                </motion.div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-6">
                No messages yet — start the conversation!
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 border-t dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 border dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
            />
            <button
              onClick={send}
              className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition flex items-center justify-center"
            >
              <SendHorizonal size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
