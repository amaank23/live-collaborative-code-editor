import { useEffect, useRef, useState } from "react";
import type { ChatMessage, RoomUser, UserSession } from "../types";

const API = "http://localhost:3001";
const WS_URL = "ws://localhost:3001/ws";

export interface UseChatResult {
  messages: ChatMessage[];
  connectedUsers: RoomUser[];
  sendMessage: (content: string) => void;
}

export function useChat(
  roomId: string | undefined,
  session: UserSession | null
): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<RoomUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch chat history from REST on mount
  useEffect(() => {
    if (!roomId) return;
    fetch(`${API}/api/rooms/${roomId}/chat`)
      .then((r) => r.json())
      .then((data: ChatMessage[]) => setMessages(data))
      .catch(() => {});
  }, [roomId]);

  // WebSocket for real-time chat + presence
  useEffect(() => {
    if (!roomId || !session) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "room:join",
          roomId,
          username: session.username,
          color: session.color,
          clientId: session.clientId,
        })
      );
    };

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string) as Record<string, unknown>;
      } catch {
        return;
      }

      if (msg.type === "room:state") {
        const { users } = msg as { users: RoomUser[] };
        setConnectedUsers(users);
      } else if (msg.type === "user:joined") {
        const { username, color, clientId } = msg as unknown as RoomUser & {
          type: string;
        };
        setConnectedUsers((prev) => {
          if (prev.some((u) => u.clientId === clientId)) return prev;
          return [...prev, { username, color, clientId }];
        });
      } else if (msg.type === "user:left") {
        const { clientId } = msg as { type: string; clientId: string };
        setConnectedUsers((prev) =>
          prev.filter((u) => u.clientId !== clientId)
        );
      } else if (msg.type === "chat:message") {
        const { id, username, content, createdAt } = msg as {
          type: string;
          id: string;
          username: string;
          content: string;
          createdAt: string;
        };
        setMessages((prev) => [
          ...prev,
          { id, roomId: roomId!, username, content, createdAt },
        ]);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnectedUsers([]);
    };
  }, [roomId, session]);

  function sendMessage(content: string) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "chat:send", content }));
  }

  return { messages, connectedUsers, sendMessage };
}
