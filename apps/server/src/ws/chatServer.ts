import type { IncomingMessage, Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "../db/prisma";

interface ConnectedClient {
  ws: WebSocket;
  roomId: string;
  username: string;
  color: string;
  clientId: string;
}

// Room membership: roomId → set of connected clients
const rooms = new Map<string, Set<ConnectedClient>>();

function addToRoom(client: ConnectedClient): void {
  if (!rooms.has(client.roomId)) {
    rooms.set(client.roomId, new Set());
  }
  rooms.get(client.roomId)!.add(client);
}

function removeFromRoom(client: ConnectedClient): void {
  const room = rooms.get(client.roomId);
  if (!room) return;
  room.delete(client);
  if (room.size === 0) rooms.delete(client.roomId);
}

function broadcast(
  roomId: string,
  payload: unknown,
  exclude?: WebSocket
): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(payload);
  room.forEach((c) => {
    if (c.ws !== exclude && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(msg);
    }
  });
}

function sendTo(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function createChatServer(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket) => {
    let client: ConnectedClient | null = null;

    ws.on("message", async (data) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(data.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      const { type } = msg;

      if (type === "room:join") {
        const { roomId, username, color, clientId } = msg as {
          roomId: string;
          username: string;
          color: string;
          clientId: string;
        };
        client = { ws, roomId, username, color, clientId };
        addToRoom(client);

        // Send current room users to the joining client
        const users = [...(rooms.get(roomId) ?? [])].map((c) => ({
          username: c.username,
          color: c.color,
          clientId: c.clientId,
        }));
        sendTo(ws, { type: "room:state", users });

        // Notify everyone else that a new user joined
        broadcast(
          roomId,
          { type: "user:joined", username, color, clientId },
          ws
        );
      }

      if (type === "chat:send" && client) {
        const { content } = msg as { content: string };
        if (!content?.trim()) return;

        const saved = await prisma.chatMessage.create({
          data: {
            roomId: client.roomId,
            username: client.username,
            content: content.trim(),
          },
        });

        broadcast(client.roomId, {
          type: "chat:message",
          id: saved.id,
          username: saved.username,
          content: saved.content,
          createdAt: saved.createdAt.toISOString(),
        });
      }
    });

    ws.on("close", () => {
      if (!client) return;
      broadcast(client.roomId, { type: "user:left", clientId: client.clientId });
      removeFromRoom(client);
      client = null;
    });

    ws.on("error", () => {
      if (!client) return;
      broadcast(client.roomId, { type: "user:left", clientId: client.clientId });
      removeFromRoom(client);
      client = null;
    });
  });

  httpServer.on("upgrade", (request: IncomingMessage, socket, head) => {
    if (request.url === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  console.log("[ws] Chat WebSocket server attached");
}
