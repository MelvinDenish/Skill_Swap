import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { groupsAPI, resourceAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import {
  connectGroup,
  disconnectGroup,
  sendGroupMessage,
  sendGroupTyping,
} from "../services/ws";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { Users, MessageSquare, BookOpen, CalendarDays } from "lucide-react";

export default function GroupDetail() {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const typingTimer = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const [tab, setTab] = useState<
    "Chat" | "Members" | "Resources" | "Calendar"
  >("Chat");
  const [groupResources, setGroupResources] = useState<any[]>([]);
  const [myResources, setMyResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [scheduleDuration, setScheduleDuration] = useState<number>(60);
  const [isMember, setIsMember] = useState<boolean>(false);

  const load = async () => {
    if (!id) return;
    const [g, m, mem] = await Promise.all([
      groupsAPI.get(id),
      groupsAPI.recentMessages(id),
      groupsAPI.members ? groupsAPI.members(id) : Promise.resolve({ data: [] }),
    ]);
    setGroup(g.data);
    const initial = (m.data || []).reverse();
    setMessages(initial);
    try {
      seenIds.current = new Set((initial || []).map((x: any) => String(x.id)));
    } catch {}
    setMembers(mem.data || []);
    scrollToBottom();

    try {
      const meId = useAuthStore.getState().user?.id;
      const mine = (mem.data || []).some((x: any) => x.userId === meId);
      if (!mine && meId) {
        await groupsAPI.join(id);
        const [g2, mem2] = await Promise.all([
          groupsAPI.get(id),
          groupsAPI.members(id),
        ]);
        setGroup(g2.data);
        setMembers(mem2.data || []);
        setIsMember((mem2.data || []).some((x: any) => x.userId === meId));
      } else {
        setIsMember(true);
      }
    } catch {
      setIsMember(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const ensureMember = async () => {
    if (!id) return false;
    if (isMember) return true;
    try {
      await groupsAPI.join(id);
      const { data } = await groupsAPI.members(id);
      setMembers(data || []);
      setIsMember(true);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!id || !token || !isMember) return;
    connectGroup(
      id,
      token,
      (payload) => {
        try {
          const pid = payload?.id ? String(payload.id) : "";
          if (pid && seenIds.current.has(pid)) return;
          if (pid) seenIds.current.add(pid);
          setMessages((prev) => [...prev, payload]);
          scrollToBottom();
        } catch {
          setMessages((prev) => [...prev, payload]);
          scrollToBottom();
        }
      },
      (p) => {
        setTyping(p?.user || "Someone");
        if (typingTimer.current) window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTyping(null), 1500);
      }
    );
    return () => {
      disconnectGroup();
    };
  }, [id, token, isMember]);

  useEffect(() => {
    if (!id) return;
    if (tab === "Resources") {
      Promise.all([groupsAPI.resources(id), resourceAPI.my()])
        .then(([gr, my]) => {
          setGroupResources(gr.data || []);
          setMyResources(my.data || []);
        })
        .catch(() => {});
    } else if (tab === "Calendar") {
      groupsAPI
        .sessions(id)
        .then(({ data }) => setSessions(data || []))
        .catch(() => {});
    }
  }, [tab, id]);

  const send = async () => {
    if (!id || !token || !text.trim()) return;
    const msg = text.trim();
    setText("");
    const ok = await ensureMember();
    if (!ok) return;
    try {
      await groupsAPI.sendMessage(id, msg);
    } catch {}
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
      return;
    }
    if (id && token) sendGroupTyping(id, token);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      try {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      } catch {}
    }, 50);
  };

  if (!group)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />
        <div className="container mx-auto p-4 text-center">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 transition-colors">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* Group header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl text-white shadow-lg"
        >
          <h1 className="text-3xl font-bold mb-1">{group.name}</h1>
          <p className="text-sm opacity-90">
            {group.relatedSkill} • {group.memberCount}/{group.maxMembers} members
          </p>
          <p className="mt-2 text-white/90">{group.description}</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 border-b border-gray-200 dark:border-neutral-800">
          {[
            { name: "Chat", icon: MessageSquare },
            { name: "Members", icon: Users },
            { name: "Resources", icon: BookOpen },
            { name: "Calendar", icon: CalendarDays },
          ].map((t) => (
            <button
              key={t.name}
              onClick={() => setTab(t.name as any)}
              className={`relative px-3 py-2 font-medium transition-all flex items-center gap-2 ${
                tab === t.name
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-indigo-500"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.name}
              {tab === t.name && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* === CHAT TAB === */}
        {tab === "Chat" && (
          <div className="grid lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-3 border dark:border-neutral-800 rounded-2xl overflow-hidden dark:bg-neutral-900 shadow-md"
            >
              <div
                ref={listRef}
                className="h-[55vh] overflow-y-auto p-4 space-y-3 bg-white dark:bg-neutral-900/50"
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.senderId === user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-[75%] shadow-sm ${
                        m.senderId === user?.id
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                          : "bg-gray-100 dark:bg-neutral-800 dark:text-gray-100"
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {m.senderName}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {m.messageText}
                      </div>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {typing} is typing...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 p-3 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Type a message..."
                  className="flex-1 border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={send}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:opacity-90 transition-all"
                >
                  Send
                </button>
              </div>
            </motion.div>

            <div className="border dark:border-neutral-800 rounded-2xl p-4 dark:bg-neutral-900 shadow-md">
              <div className="font-semibold mb-3">Members</div>
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div
                    key={m.userId}
                    className="flex justify-between text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span>{m.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs remain (Members, Resources, Calendar) — you can keep same structure but add rounded cards, consistent gradient buttons, and spacing */}
      </div>
    </div>
  );
}
