import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import CollaborativeEditor from "../components/editor/CollaborativeEditor";
import { getColorForUsername, getInitials } from "../lib/colors";
import { useYjs } from "../hooks/useYjs";
import type { Room, UserSession } from "../types";

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

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [session, setSession] = useState<UserSession | null>(getSession);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Track dark mode for Monaco theme
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );

  // Listen for theme changes triggered by ThemeToggle
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

  // Active file — Phase 6 will replace this with useFileSystem
  const activeFileId = room?.files[0]?.id;
  const activeLanguage = room?.files[0]?.language ?? "javascript";

  // Y.js connection for the active file
  const { yText, provider, status } = useYjs(
    session ? roomId : undefined,
    session ? activeFileId : undefined
  );

  // Fetch room metadata
  useEffect(() => {
    if (!roomId) return;
    fetch(`${API}/api/rooms/${roomId}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setRoom(data);
          setLoading(false);
        }
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [roomId]);

  // Show username modal once room is confirmed to exist
  useEffect(() => {
    if (!loading && !notFound && !session) {
      setShowUsernameModal(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading, notFound, session]);

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
  if (loading) {
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
  if (notFound) {
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
                {roomId}
              </span>
              {/* Connection status */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                  {status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: session.color }}
                >
                  {getInitials(session.username)}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {session.username}
                </span>
              </div>
              <ThemeToggle />
            </div>
          </header>

          {/* 3-column body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar — file explorer placeholder */}
            <aside className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                Files
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400 dark:text-gray-600 text-center px-3">
                  File explorer — Phase 6
                </p>
              </div>
            </aside>

            {/* Editor */}
            <main className="flex-1 flex flex-col overflow-hidden">
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

            {/* Chat panel placeholder */}
            <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                Chat
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400 dark:text-gray-600 text-center px-3">
                  Chat panel — Phase 7
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
