import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import CollaborativeEditor from "../components/editor/CollaborativeEditor";
import EditorToolbar from "../components/editor/EditorToolbar";
import FileExplorer from "../components/sidebar/FileExplorer";
import ChatPanel from "../components/chat/ChatPanel";
import UserList from "../components/presence/UserList";
import { getColorForUsername } from "../lib/colors";
import { useYjs } from "../hooks/useYjs";
import { useAwareness } from "../hooks/useAwareness";
import { useFileSystem } from "../hooks/useFileSystem";
import { useChat } from "../hooks/useChat";
import { getMonacoLanguage } from "../lib/languages";
import type { UserSession } from "../types";

const API = "http://localhost:3001";
const SESSION_KEY = "collab_session";

function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: UserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [roomExists, setRoomExists] = useState<boolean | null>(null); // null = loading
  const [roomName, setRoomName] = useState<string | null>(null);

  const [session, setSession] = useState<UserSession | null>(getSession);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Track dark mode for Monaco theme
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Verify room exists
  useEffect(() => {
    if (!roomId) return;
    fetch(`${API}/api/rooms/${roomId}`)
      .then((res) => {
        if (res.status === 404) {
          setRoomExists(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setRoomExists(true);
          setRoomName(data.name ?? null);
        }
      })
      .catch(() => setRoomExists(false));
  }, [roomId]);

  // File system — CRDT-synced file manifest + REST CRUD
  const {
    files,
    activeFileId,
    setActiveFileId,
    createFile,
    deleteFile,
    renameFile,
    updateLanguage,
  } = useFileSystem(session ? roomId : undefined);

  const activeFile = files.find((f) => f.id === activeFileId);
  const activeLanguage = getMonacoLanguage(activeFile?.language ?? "javascript");

  // Y.js for the active file (re-connects when file switches)
  const { yText, provider, status } = useYjs(
    session ? roomId : undefined,
    session ? (activeFileId ?? undefined) : undefined
  );

  // Awareness — sets local user info + tracks remote cursors for user list
  const { remoteUsers } = useAwareness(provider, session);

  // Chat WS — messages + room user colors (for chat bubbles)
  const { messages, connectedUsers, sendMessage } = useChat(
    session ? roomId : undefined,
    session
  );

  // Show username modal once room is confirmed to exist
  useEffect(() => {
    if (roomExists === true && !session) {
      setShowUsernameModal(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [roomExists, session]);

  function handleSetUsername(e: React.FormEvent) {
    e.preventDefault();
    const name = usernameInput.trim();
    if (!name) {
      setUsernameError("Please enter a username.");
      return;
    }
    if (name.length > 24) {
      setUsernameError("Max 24 characters.");
      return;
    }
    const newSession: UserSession = {
      username: name,
      clientId: nanoid(),
      color: getColorForUsername(name),
    };
    saveSession(newSession);
    setSession(newSession);
    setShowUsernameModal(false);
  }

  // Status dot color
  const statusColor =
    status === "connected"
      ? "bg-green-500"
      : status === "connecting"
      ? "bg-yellow-500 animate-pulse"
      : "bg-red-500";

  // Loading state
  if (roomExists === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading room…
        </div>
      </div>
    );
  }

  // 404 state
  if (roomExists === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Room not found
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            The room{" "}
            <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {roomId}
            </code>{" "}
            doesn't exist.
          </p>
          <Button onClick={() => navigate("/")} variant="secondary">
            Go home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Username modal */}
      <Modal open={showUsernameModal} title="Choose a username">
        <form onSubmit={handleSetUsername} className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This name will be visible to other collaborators in the room.
          </p>
          <Input
            ref={inputRef}
            placeholder="e.g. Aman"
            value={usernameInput}
            onChange={(e) => {
              setUsernameInput(e.target.value);
              setUsernameError("");
            }}
            error={usernameError}
            maxLength={24}
            autoComplete="off"
          />
          <Button type="submit" className="w-full">
            Join room
          </Button>
        </form>
      </Modal>

      {/* Editor shell */}
      {session && (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {/* Top toolbar */}
          <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100"
              >
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-sm">CodeCollab</span>
              </a>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                {roomName ?? roomId}
              </span>
              {/* Connection status */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                  {status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyLink}
                title="Copy room link"
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Share
                  </>
                )}
              </button>
              <UserList session={session} remoteUsers={remoteUsers} />
              <ThemeToggle />
            </div>
          </header>

          {/* 3-column body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar — file explorer */}
            {sidebarOpen && (
              <aside className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
                <FileExplorer
                  files={files}
                  activeFileId={activeFileId}
                  onSelectFile={setActiveFileId}
                  onCreateFile={createFile}
                  onDeleteFile={deleteFile}
                  onRenameFile={renameFile}
                />
              </aside>
            )}

            {/* Editor */}
            <main className="flex-1 flex flex-col overflow-hidden">
              <EditorToolbar
                file={activeFile}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((o) => !o)}
                onUpdateLanguage={updateLanguage}
              />
              {yText && provider ? (
                <CollaborativeEditor
                  yText={yText}
                  provider={provider}
                  language={activeLanguage}
                  isDark={isDark}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600 text-sm">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Connecting to room…
                  </div>
                </div>
              )}
            </main>

            {/* Chat panel */}
            <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
              <ChatPanel
                messages={messages}
                session={session}
                connectedUsers={connectedUsers}
                onSendMessage={sendMessage}
              />
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
