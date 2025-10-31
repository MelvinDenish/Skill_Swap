import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { groupsAPI, resourceAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { connectGroup, disconnectGroup, sendGroupMessage, sendGroupTyping } from '../services/ws';
import Navbar from '../components/Navbar';

export default function GroupDetail() {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const typingTimer = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const [tab, setTab] = useState<'Chat'|'Members'|'Resources'|'Calendar'>('Chat');
  const [groupResources, setGroupResources] = useState<any[]>([]);
  const [myResources, setMyResources] = useState<any[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [scheduleAt, setScheduleAt] = useState<string>('');
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
    try { seenIds.current = new Set((initial || []).map((x: any) => String(x.id))); } catch {}
    setMembers(mem.data || []);
    scrollToBottom();
    // Auto-join if not a member yet
    try {
      const meId = useAuthStore.getState().user?.id;
      const mine = (mem.data || []).some((x: any) => x.userId === meId);
      if (!mine && meId) {
        await groupsAPI.join(id);
        const [g2, mem2] = await Promise.all([groupsAPI.get(id), groupsAPI.members(id)]);
        setGroup(g2.data);
        setMembers(mem2.data || []);
        setIsMember((mem2.data || []).some((x: any) => x.userId === meId));
      } else {
        setIsMember(true);
      }
    } catch { setIsMember(false); }
  };

  useEffect(() => { load(); }, [id]);

  const ensureMember = async () => {
    if (!id) return false;
    if (isMember) return true;
    try {
      await groupsAPI.join(id);
      const { data } = await groupsAPI.members(id);
      setMembers(data || []);
      setIsMember(true);
      return true;
    } catch { return false; }
  };

  useEffect(() => {
    if (!id || !token || !isMember) return;
    connectGroup(
      id,
      token,
      (payload) => {
        try {
          const pid = payload?.id ? String(payload.id) : '';
          if (pid && seenIds.current.has(pid)) return;
          if (pid) seenIds.current.add(pid);
          setMessages((prev) => [...prev, payload]);
          scrollToBottom();
        } catch { setMessages((prev) => [...prev, payload]); scrollToBottom(); }
      },
      (p) => { setTyping(p?.user || 'Someone'); if (typingTimer.current) window.clearTimeout(typingTimer.current); typingTimer.current = window.setTimeout(() => setTyping(null), 1500); }
    );
    return () => { disconnectGroup(); };
  }, [id, token, isMember]);

  useEffect(() => {
    if (!id) return;
    if (tab === 'Resources') {
      Promise.all([
        groupsAPI.resources(id),
        resourceAPI.my()
      ]).then(([gr, my]) => {
        setGroupResources(gr.data || []);
        setMyResources(my.data || []);
      }).catch(() => {});
    } else if (tab === 'Calendar') {
      groupsAPI.sessions(id).then(({ data }) => setSessions(data || [])).catch(() => {});
    }
  }, [tab, id]);

  const send = async () => {
    if (!id || !token || !text.trim()) return;
    const msg = text.trim();
    setText('');
    const ok = await ensureMember();
    if (!ok) return;
    try {
      await groupsAPI.sendMessage(id, msg);
      // Do not append here; wait for WS broadcast to arrive once
    } catch {}
    // WS publish not needed because backend broadcasts REST-created messages
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); send(); return; }
    if (id && token) sendGroupTyping(id, token);
  };

  const scrollToBottom = () => {
    setTimeout(() => { try { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); } catch {} }, 50);
  };

  if (!group) return <div className="min-h-screen bg-gray-50 dark:bg-neutral-950"><Navbar /><div className="container mx-auto p-4">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />
      <div className="container mx-auto p-4">
      <div className="mb-4">
        <div className="text-2xl font-bold">{group.name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{group.relatedSkill} · {group.memberCount}/{group.maxMembers} members</div>
        <div className="mt-2 text-gray-800 dark:text-gray-200">{group.description}</div>
      </div>

      <div className="mb-4 flex gap-2">
        {(['Chat','Members','Resources','Calendar'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded ${tab===t ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-900 border dark:border-neutral-800'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 border dark:border-neutral-800 rounded-lg overflow-hidden dark:bg-neutral-900">
            <div ref={listRef} className="h-[50vh] overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-neutral-900">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-900 dark:text-neutral-100'} border dark:border-neutral-800 rounded px-3 py-2 max-w-[75%]` }>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.senderName}</div>
                    <div className="whitespace-pre-wrap text-sm">{m.messageText}</div>
                  </div>
                </div>
              ))}
              {typing && (<div className="text-xs text-gray-500 dark:text-gray-400">{typing} is typing...</div>)}
            </div>
            <div className="flex items-center gap-2 p-3 border-t dark:border-neutral-800">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder="Type a message..." className="flex-1 border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-3 py-2" />
              <button onClick={send} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded px-3 py-2 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Send</button>
            </div>
          </div>
          <div className="border dark:border-neutral-800 rounded-lg p-3 dark:bg-neutral-900">
            <div className="font-semibold mb-2">Members</div>
            <div className="space-y-1">
              {members.map((m: any) => (
                <div key={m.userId} className="flex justify-between text-sm">
                  <span>{m.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Members' && (
        <div className="border dark:border-neutral-800 rounded-lg p-3 dark:bg-neutral-900">
          <div className="space-y-1">
            {members.map((m: any) => (
              <div key={m.userId} className="flex justify-between text-sm">
                <span>{m.name}</span>
                <span className="text-gray-500 dark:text-gray-400">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Resources' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 border dark:border-neutral-800 rounded-lg p-3 dark:bg-neutral-900">
            <div className="font-semibold mb-2">Shared Resources</div>
            {groupResources.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No resources yet</div>
            ) : (
              <div className="space-y-2">
                {groupResources.map((r: any) => (
                  <div key={r.id} className="border dark:border-neutral-800 rounded p-2 text-sm flex justify-between items-center dark:bg-neutral-900/50">
                    <div>
                      <div className="font-medium">{r.title || 'Untitled'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{r.type} · {r.contentType} · {r.createdAt}</div>
                    </div>
                    <a href={r.id ? (resourceAPI.downloadUrl as any)(r.id) : '#'} className="text-blue-600 text-sm">Download</a>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border dark:border-neutral-800 rounded-lg p-3 dark:bg-neutral-900">
            <div className="font-semibold mb-2">Share a resource</div>
            <select value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-2 py-2 mb-2">
              <option value="">Select from My Resources</option>
              {myResources.map((r: any) => (
                <option key={r.id} value={r.id}>{r.title || r.id}</option>
              ))}
            </select>
            <button disabled={!selectedResourceId} onClick={async () => { if (id && selectedResourceId) { const ok = await ensureMember(); if (!ok) return; await groupsAPI.shareResource(id, selectedResourceId); const { data } = await groupsAPI.resources(id); setGroupResources(data || []); } }}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded px-3 py-2 disabled:opacity-50 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Share</button>
          </div>
        </div>
      )}

      {tab === 'Calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 border dark:border-neutral-800 rounded-lg p-3 dark:bg-neutral-900">
            <div className="font-semibold mb-2">Scheduled Sessions</div>
            {sessions.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No sessions yet</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s: any) => (
                  <div key={s.id} className="border dark:border-neutral-800 rounded p-2 text-sm dark:bg-neutral-900/50">
                    <div className="font-medium">{new Date(s.scheduledTime).toLocaleString()} · {s.duration} mins</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Host: {s.createdByName || 'Unknown'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border dark:border-neutral-800 rounded-lg p-3 dark:bg-neutral-900">
            <div className="font-semibold mb-2">Schedule a Session</div>
            <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-2 py-2 mb-2" />
            <input type="number" min={15} max={240} value={scheduleDuration} onChange={(e) => setScheduleDuration(parseInt(e.target.value||'60'))} className="w-full border dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded px-2 py-2 mb-2" />
            <button disabled={!scheduleAt} onClick={async () => { if (id) { await groupsAPI.scheduleSession(id, scheduleAt, scheduleDuration); const { data } = await groupsAPI.sessions(id); setSessions(data || []); } }}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded px-3 py-2 disabled:opacity-50 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700">Schedule</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
