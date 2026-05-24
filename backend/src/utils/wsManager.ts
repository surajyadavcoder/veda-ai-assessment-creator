import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

const clients = new Map<string, { ws: WebSocket; jobId?: string }>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substr(2, 9);
    clients.set(clientId, { ws });
    ws.on('message', (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && msg.jobId) {
          const client = clients.get(clientId);
          if (client) client.jobId = msg.jobId;
        }
      } catch {}
    });
    ws.on('close', () => clients.delete(clientId));
    ws.send(JSON.stringify({ type: 'connected', clientId }));
  });
  return wss;
}

export function notifyJob(jobId: string, data: any) {
  clients.forEach((client) => {
    if (client.jobId === jobId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type: 'job_update', jobId, ...data }));
    }
  });
}
