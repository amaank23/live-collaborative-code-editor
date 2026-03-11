import { useEffect, useRef, useState } from "react";
import FileItem from "./FileItem";
import type { RoomFile } from "../../types";

interface FileExplorerProps {
  files: RoomFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, language: string) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
  onRenameFile: (id: string, newName: string) => Promise<void>;
}

/** Detect Monaco language from file extension */
function languageFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    rs: "rust",
    go: "go",
  };
  return map[ext] ?? "plaintext";
}

export default function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
}: FileExplorerProps) {
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [createError, setCreateError] = useState("");
  const newFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) {
      newFileInputRef.current?.focus();
    }
  }, [creating]);

  async function commitCreate() {
    const name = newFileName.trim();
    if (!name) {
      setCreating(false);
      setNewFileName("");
      return;
    }
    if (files.some((f) => f.name === name)) {
      setCreateError("A file with that name already exists.");
      return;
    }
    try {
      await onCreateFile(name, languageFromName(name));
      setCreating(false);
      setNewFileName("");
      setCreateError("");
    } catch {
      setCreateError("Failed to create file.");
    }
  }

  function handleNewFileKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitCreate();
    if (e.key === "Escape") {
      setCreating(false);
      setNewFileName("");
      setCreateError("");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Files
        </span>
        <button
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => {
            setCreating(true);
            setNewFileName("");
            setCreateError("");
          }}
          title="New file"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            isActive={file.id === activeFileId}
            onClick={() => onSelectFile(file.id)}
            onDelete={onDeleteFile}
            onRename={onRenameFile}
          />
        ))}

        {/* Inline new-file input */}
        {creating && (
          <div className="px-3 py-1.5">
            <input
              ref={newFileInputRef}
              className={`w-full bg-white dark:bg-gray-700 border rounded px-1.5 py-0.5 text-sm outline-none text-gray-900 dark:text-gray-100 ${
                createError
                  ? "border-red-400"
                  : "border-blue-400 dark:border-blue-500"
              }`}
              placeholder="filename.ts"
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                setCreateError("");
              }}
              onKeyDown={handleNewFileKeyDown}
              onBlur={commitCreate}
            />
            {createError && (
              <p className="text-xs text-red-500 mt-0.5">{createError}</p>
            )}
          </div>
        )}

        {files.length === 0 && !creating && (
          <p className="text-xs text-gray-400 dark:text-gray-600 px-3 py-2">
            No files yet. Click + to create one.
          </p>
        )}
      </div>
    </div>
  );
}
