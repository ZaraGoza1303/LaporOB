import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from 'jsonwebtoken';

const clients = new Map<string, Set<WebSocket>>();

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', handleConnection);
}

function handleConnection(ws: WebSocket, req: any) {
  const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
  const userId = verifyToken(token);

  if (!userId) return ws.close(4001, 'Token invalid/kosong');

  addClient(userId, ws);
  ws.send(JSON.stringify({ type: 'CONNECTED' }));
  ws.on('close', () => closeConnection(userId, ws));
}

function verifyToken(token: string | null): string | null {
  if (!token) return null;
  try {
    return (jwt.verify(token, process.env.JWT_TOKEN!) as { id: string }).id;
  } catch {
    return null;
  }
}

function addClient(userId: string, ws: WebSocket) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(ws);
}

function closeConnection(userId: string, ws: WebSocket) {
  clients.get(userId)?.delete(ws);
  if (clients.get(userId)?.size === 0) clients.delete(userId);
}

export function sendToUser(userId: string, data: object){
    const userSocket = clients.get(userId);
    if(!userSocket) return;

    const message = JSON.stringify(data);
    for(const ws of userSocket) {
        if(ws.readyState === WebSocket.OPEN) ws.send(message)
    }
}

export function sendToUsers(userIds: string[], data: object){
    for(const id of userIds) {
        sendToUser(id, data);
    }
}