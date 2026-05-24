import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

const clients = new Map<string, WebSocket>();

export const initWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    const jobId = new URL(req.url || '', 'http://localhost').searchParams.get('jobId');
    if (jobId) {
      clients.set(jobId, ws);
      ws.on('close', () => clients.delete(jobId));
    }
  });
  console.log('WebSocket initialized');
  return wss;
};

export const notifyClient = (jobId: string, data: object) => {
  const client = clients.get(jobId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
};
