import { getInitials } from "../../lib/colors";
import type { UserSession } from "../../types";
import type { RemoteUser } from "../../hooks/useAwareness";

interface UserListProps {
  session: UserSession;
  remoteUsers: RemoteUser[];
}

export default function UserList({ session, remoteUsers }: UserListProps) {
  const allUsers = [
    { username: session.username, color: session.color, isLocal: true },
    ...remoteUsers.map((u) => ({
      username: u.username,
      color: u.color,
      isLocal: false,
    })),
  ];

  return (
    <div className="flex items-center gap-1">
      {allUsers.map((user, i) => (
        <div key={i} className="relative group">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-900 cursor-default"
            style={{ backgroundColor: user.color }}
          >
            {getInitials(user.username)}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {user.username}
              {user.isLocal && (
                <span className="ml-1 text-gray-400">(you)</span>
              )}
            </div>
            <div className="w-1.5 h-1.5 bg-gray-900 dark:bg-gray-700 rotate-45 -mt-0.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
