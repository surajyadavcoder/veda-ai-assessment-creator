const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

type MessageHandler = (data: any) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectTimer: any = null;

  connect() {
    if (typeof window === 'undefined') return;
    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.onopen = () => console.log('WS connected');
      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const handlers = this.handlers.get(data.type) || [];
          handlers.forEach(h => h(data));
        } catch {}
      };
      this.ws.onclose = () => {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };
    } catch {}
  }

  subscribe(jobId: string) {
    this.ws?.send(JSON.stringify({ type: 'subscribe', jobId }));
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type) || [];
    this.handlers.set(type, handlers.filter(h => h !== handler));
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}

export const wsClient = new WSClient();
