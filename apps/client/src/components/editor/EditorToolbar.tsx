import { LANGUAGES } from "../../lib/languages";
import type { RoomFile } from "../../types";

interface EditorToolbarProps {
  file: RoomFile | undefined;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onUpdateLanguage: (fileId: string, language: string) => Promise<void>;
}

export default function EditorToolbar({
  file,
  sidebarOpen,
  onToggleSidebar,
  onUpdateLanguage,
}: EditorToolbarProps) {
  if (!file) return null;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            )}
          </svg>
        </button>
        {/* File name */}
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
          {file.name}
        </span>
      </div>

      {/* Language selector */}
      <select
        className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 focus:ring-1 focus:ring-blue-500"
        value={file.language}
        onChange={(e) => onUpdateLanguage(file.id, e.target.value)}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
