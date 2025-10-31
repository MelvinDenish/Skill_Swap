import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client: Client | null = null;
let subscription: any = null;
let groupClient: Client | null = null;
let groupSubs: any = null;
let groupTypingSubs: any = null;
let userClient: Client | null = null;
let userSubs: any = null;

const getBase = () => {
  const api = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (api && typeof api === 'string') {
    // strip trailing /api
    try { return api.replace(/\/?api\/?$/, ''); } catch { return ''; }
  }
  return '';
};

export function connectNotifications(userId: string, onMessage: (payload: any) => void) {
  disconnectNotifications();
  const base = getBase();
  client = new Client({
    webSocketFactory: () => new SockJS(`${base}/ws`),
    reconnectDelay: 5000,
  });
  client.onConnect = () => {
    subscription = client!.subscribe(`/topic/notifications/${userId}`, (message: IMessage) => {
      try {
        const body = JSON.parse(message.body);
        onMessage(body);
      } catch {
        // ignore
      }
    });
  };
  client.activate();
}

export function disconnectNotifications() {
  try { subscription?.unsubscribe?.(); } catch {}
  subscription = null;
  try { client?.deactivate?.(); } catch {}
  client = null;
}

export function connectGroup(groupId: string, token: string, onMessage: (payload: any) => void, onTyping?: (payload: any) => void, onConnected?: () => void) {
  disconnectGroup();
  const base = getBase();
  groupClient = new Client({
    webSocketFactory: () => new SockJS(`${base}/ws`),
    reconnectDelay: 5000,
    connectHeaders: { Authorization: `Bearer ${token}`, token },
  });
  groupClient.onConnect = () => {
    try { onConnected && onConnected(); } catch {}
    groupSubs = groupClient!.subscribe(`/topic/group/${groupId}`, (message: IMessage) => {
      try { onMessage(JSON.parse(message.body)); } catch {}
    }, { Authorization: `Bearer ${token}`, token });
    if (onTyping) {
      groupTypingSubs = groupClient!.subscribe(`/topic/group/${groupId}/typing`, (message: IMessage) => {
        try { onTyping(JSON.parse(message.body)); } catch {}
      }, { Authorization: `Bearer ${token}`, token });
    }
  };
  groupClient.activate();
}

export function disconnectGroup() {
  try { groupSubs?.unsubscribe?.(); } catch {}
  try { groupTypingSubs?.unsubscribe?.(); } catch {}
  groupSubs = null; groupTypingSubs = null;
  try { groupClient?.deactivate?.(); } catch {}
  groupClient = null;
}

export function sendGroupMessage(groupId: string, token: string, text: string) {
  if (!groupClient || !groupClient.connected) return;
  groupClient.publish({ destination: `/app/group/${groupId}/send`, headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ text }) });
}

export function sendGroupTyping(groupId: string, token: string) {
  if (!groupClient || !groupClient.connected) return;
  groupClient.publish({ destination: `/app/group/${groupId}/typing`, headers: { Authorization: `Bearer ${token}` }, body: '{}' });
}

export function connectUserQueue(userId: string, token: string, onMessage: (payload: any) => void) {
  disconnectUserQueue();
  const base = getBase();
  userClient = new Client({
    webSocketFactory: () => new SockJS(`${base}/ws`),
    reconnectDelay: 5000,
    connectHeaders: { Authorization: `Bearer ${token}` },
  });
  userClient.onConnect = () => {
    userSubs = userClient!.subscribe(`/queue/user/${userId}`, (message: IMessage) => {
      try { onMessage(JSON.parse(message.body)); } catch {}
    });
  };
  userClient.activate();
}

export function disconnectUserQueue() {
  try { userSubs?.unsubscribe?.(); } catch {}
  userSubs = null;
  try { userClient?.deactivate?.(); } catch {}
  userClient = null;
}
