import { useEffect, useRef } from "react";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { ChatMessage, RoomUser, UserSession } from "../../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  session: UserSession;
  connectedUsers: RoomUser[];
  onSendMessage: (content: string) => void;
}

export default function ChatPanel({
  messages,
  session,
  connectedUsers,
  onSendMessage,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build a color lookup for usernames from connected users
  const userColorMap: Record<string, string> = {};
  connectedUsers.forEach((u) => {
    userColorMap[u.username] = u.color;
  });
  userColorMap[session.username] = session.color;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 shrink-0">
        Chat
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-4">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessageComponent
            key={msg.id}
            message={msg}
            isOwn={msg.username === session.username}
            color={userColorMap[msg.username] ?? "#6366f1"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSendMessage} />
    </div>
  );
}
