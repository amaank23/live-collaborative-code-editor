import type { ChatMessage } from "../../types";

interface ChatMessageProps {
  message: ChatMessage;
  isOwn: boolean;
  color: string;
}

export default function ChatMessage({ message, isOwn, color }: ChatMessageProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
      {!isOwn && (
        <span className="text-xs font-medium px-1" style={{ color }}>
          {message.username}
        </span>
      )}
      <div
        className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-sm break-words ${
          isOwn
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-600 px-1">
        {time}
      </span>
    </div>
  );
}
