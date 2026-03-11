import { useEffect, useRef, useState } from "react";
import type { RoomFile } from "../../types";

interface FileItemProps {
  file: RoomFile;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export default function FileItem({
  file,
  isActive,
  onClick,
  onDelete,
  onRename,
}: FileItemProps) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.select();
    }
  }, [renaming]);

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setRenameValue(file.name);
    setRenaming(true);
  }

  function commitRename() {
    const name = renameValue.trim();
    if (name && name !== file.name) {
      onRename(file.id, name);
    }
    setRenaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") {
      setRenameValue(file.name);
      setRenaming(false);
    }
  }

  return (
    <div
      className={`group relative flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-sm select-none ${
        isActive
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* File icon */}
      <svg
        className="w-3.5 h-3.5 shrink-0 opacity-60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>

      {renaming ? (
        <input
          ref={inputRef}
          className="flex-1 bg-white dark:bg-gray-700 border border-blue-400 rounded px-1 py-0 text-sm outline-none text-gray-900 dark:text-gray-100 min-w-0"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitRename}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{file.name}</span>
      )}

      {/* Delete button — only show on hover, not while renaming */}
      {!renaming && (
        <button
          className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id);
          }}
          title="Delete file"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
