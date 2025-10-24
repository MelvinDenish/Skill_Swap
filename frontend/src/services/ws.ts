import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client: Client | null = null;
let subscription: any = null;

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
