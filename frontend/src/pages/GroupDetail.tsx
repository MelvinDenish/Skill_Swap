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
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";
import { Users, MessageSquare, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

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
    "Chat" | "Members" | "Resources"
  >("Chat");
  const [groupResources, setGroupResources] = useState<any[]>([]);
  const [myResources, setMyResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [isMember, setIsMember] = useState<boolean>(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Resources create/share state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDesc, setLinkDesc] = useState("");
  const [linkSkill, setLinkSkill] = useState("");

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
      },
      (presence) => {
        try {
          const arr = presence?.onlineUserIds || [];
          setOnlineUserIds(arr.map((x: any) => String(x)));
        } catch {}
      },
      () => {}
    );
    return () => {
      disconnectGroup();
    };
  }, [id, token, isMember]);

  const refreshGroupResources = async () => {
    if (!id) return;
    try {
      const { data } = await groupsAPI.resources(id);
      setGroupResources(data || []);
    } catch {}
  };

  const refreshMyResources = async () => {
    try {
      const { data } = await resourceAPI.my();
      setMyResources(data || []);
    } catch {}
  };

  useEffect(() => {
    if (!id) return;
    if (tab === "Resources") {
      Promise.all([groupsAPI.resources(id), resourceAPI.my()])
        .then(([gr, my]) => {
          setGroupResources(gr.data || []);
          setMyResources(my.data || []);
        })
        .catch(() => {});
    }
  }, [tab, id]);

  useEffect(() => {
    if (!id) return;
    groupsAPI.presence(id).then(({ data }) => {
      setOnlineUserIds((data || []).map((x: any) => String(x)));
    }).catch(() => {});
  }, [id]);

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

  // Share an existing resource from "My Resources"
  const shareExisting = async () => {
    if (!id || !selectedResourceId) return;
    const ok = await ensureMember();
    if (!ok) return;
    try {
      await groupsAPI.shareResource(id, selectedResourceId);
      setSelectedResourceId("");
      await refreshGroupResources();
      toast.success("Shared to group");
    } catch {
      toast.error("Failed to share");
    }
  };

  // Upload a new file then share to group
  const uploadToGroup = async () => {
    if (!id || !selectedFile) return;
    const ok = await ensureMember();
    if (!ok) return;
    setUploading(true);
    try {
      const { data } = await resourceAPI.upload(selectedFile, undefined, linkSkill || undefined);
      const resourceId = data?.id;
      if (resourceId) {
        await groupsAPI.shareResource(id, resourceId);
      }
      setSelectedFile(null);
      await Promise.all([refreshGroupResources(), refreshMyResources()]);
      toast.success("File uploaded and shared");
    } catch {
      toast.error("Upload or share failed");
    } finally {
      setUploading(false);
    }
  };

  // Create a link then share to group
  const createLinkToGroup = async () => {
    if (!id || !linkTitle || !linkUrl) return;
    const ok = await ensureMember();
    if (!ok) return;
    try {
      const { data } = await resourceAPI.link({ title: linkTitle, url: linkUrl, description: linkDesc || undefined, skillName: linkSkill || undefined });
      const resourceId = data?.id;
      if (resourceId) {
        await groupsAPI.shareResource(id, resourceId);
      }
      setLinkTitle("");
      setLinkUrl("");
      setLinkDesc("");
      await Promise.all([refreshGroupResources(), refreshMyResources()]);
      toast.success("Link added and shared");
    } catch {
      toast.error("Failed to add link");
    }
  };

  if (!group)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />
        <div className="container mx-auto p-4">
          <LoadingSpinner />
        </div>
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
                    className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${onlineUserIds.includes(String(m.userId)) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {m.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {m.role}
                    </span>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No members found.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === MEMBERS TAB === */}
        {tab === "Members" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 border dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow">
              <div className="font-semibold mb-3">Members</div>
              <div className="divide-y dark:divide-neutral-800">
                {members.map((m: any) => (
                  <div key={m.userId} className="py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${onlineUserIds.includes(String(m.userId)) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span>{m.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{m.role}</span>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-4">No members yet.</div>
                )}
              </div>
            </div>
            <div className="p-5 border dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow">
              <div className="font-semibold mb-3">Online Now</div>
              <div className="flex flex-wrap gap-2">
                {members.filter((m: any) => onlineUserIds.includes(String(m.userId))).map((m: any) => (
                  <span key={m.userId} className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300 text-sm">{m.name}</span>
                ))}
                {members.filter((m: any) => onlineUserIds.includes(String(m.userId))).length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No one online.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === RESOURCES TAB === */}
        {tab === "Resources" && (
          <div className="space-y-6">
            {!isMember ? (
              <div className="p-6 border dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-200">
                You need to join this group to access resources.
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Upload file to group */}
                  <div className="p-5 border dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow">
                    <div className="font-semibold mb-3">Upload a file to this group</div>
                    <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full mb-2" />
                    <input value={linkSkill} onChange={(e) => setLinkSkill(e.target.value)} placeholder="Skill (optional)" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50 mb-3" />
                    <button onClick={uploadToGroup} disabled={!selectedFile || uploading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:opacity-90 disabled:opacity-60">
                      {uploading ? 'Uploading...' : selectedFile ? `Upload ${selectedFile.name}` : 'Choose a file'}
                    </button>
                  </div>

                  {/* Add link to group */}
                  <div className="p-5 border dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow">
                    <div className="font-semibold mb-3">Add a link to this group</div>
                    <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Title" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50 mb-2" />
                    <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com/resource" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50 mb-2" />
                    <textarea value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50 mb-2" />
                    <input value={linkSkill} onChange={(e) => setLinkSkill(e.target.value)} placeholder="Skill (optional)" className="w-full border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50 mb-3" />
                    <button onClick={createLinkToGroup} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:opacity-90">
                      Add Link
                    </button>
                  </div>
                </div>

                <div className="p-5 border dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow">
                  <div className="font-semibold mb-3">Share one of your existing resources</div>
                  <div className="flex gap-2">
                    <select value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)} className="flex-1 border rounded-lg p-2 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <option value="">Select a resource...</option>
                      {myResources.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {(r.title || r.url || r.fileKey || 'Untitled')} • {r.type}
                        </option>
                      ))}
                    </select>
                    <button onClick={shareExisting} disabled={!selectedResourceId} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:opacity-90 disabled:opacity-60">
                      Share
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b dark:border-neutral-800">
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Skill</th>
                        <th className="py-2 px-3">Added</th>
                        <th className="py-2 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupResources.map((r: any) => (
                        <tr key={r.id} className="border-b last:border-0 dark:border-neutral-800">
                          <td className="py-2 px-3">{r.title || (r.type === 'LINK' ? (r.url || 'Link') : 'File')}</td>
                          <td className="py-2 px-3">{r.type}</td>
                          <td className="py-2 px-3">{r.skillName || '-'}</td>
                          <td className="py-2 px-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                          <td className="py-2 px-3">
                            {r.type === 'LINK' ? (
                              <a href={r.url || '#'} target="_blank" rel="noreferrer" className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 inline-block">Open</a>
                            ) : (
                              <a href={resourceAPI.downloadUrl(r.id)} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-800 inline-block">Download</a>
                            )}
                          </td>
                        </tr>
                      ))}
                      {groupResources.length === 0 && (
                        <tr><td className="py-4 text-gray-500 dark:text-gray-400" colSpan={5}>No group resources yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Other tabs remain (Members, Resources) — structure kept consistent with the app */}
      </div>
    </div>
  );
}
