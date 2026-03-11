import { LANGUAGES } from "../../lib/languages";
import type { RoomFile } from "../../types";

interface EditorToolbarProps {
  file: RoomFile | undefined;
  onUpdateLanguage: (fileId: string, language: string) => Promise<void>;
}

export default function EditorToolbar({
  file,
  onUpdateLanguage,
}: EditorToolbarProps) {
  if (!file) return null;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
      {/* File name */}
      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
        {file.name}
      </span>

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
