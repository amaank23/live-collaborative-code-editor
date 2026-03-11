import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";

const API = "http://localhost:3001";

export default function HomePage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const room = await res.json();
      navigate(`/room/${room.id}`);
    } catch {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) return;

    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch(`${API}/api/rooms/${id}`);
      if (res.status === 404) {
        setJoinError("Room not found. Check the ID and try again.");
        setJoining(false);
        return;
      }
      navigate(`/room/${id}`);
    } catch {
      setJoinError("Could not connect to server.");
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">CodeCollab</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Live Collaborative Editor
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Code together in real time — no account required
            </p>
          </div>

          {/* Create room */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Start a new session
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Create a room and share the link with collaborators.
            </p>
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? "Creating…" : "Create new room"}
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400">or join existing</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Join room */}
          <form
            onSubmit={handleJoin}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4"
          >
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Join an existing room
            </h2>
            <Input
              placeholder="Enter room ID (e.g. k3mP9xQr)"
              value={joinId}
              onChange={(e) => { setJoinId(e.target.value); setJoinError(""); }}
              error={joinError}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={joining || !joinId.trim()}
              className="w-full"
            >
              {joining ? "Joining…" : "Join room"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
