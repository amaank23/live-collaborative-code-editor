# CodeCollab — Live Collaborative Code Editor

A real-time collaborative code editor built as a portfolio project. Multiple users can edit code together in the same room, see each other's cursors, chat, and manage files — all synced instantly via CRDTs.

## Features

- **Real-time collaborative editing** — conflict-free sync via Y.js CRDT; no merge conflicts
- **Multi-file support** — create, rename, and delete files per room; file list synced across all tabs via Y.Map
- **Remote cursors & presence** — colored cursor labels and user avatars for every connected collaborator
- **Live chat** — persistent room chat over a dedicated WebSocket with message history
- **Collaborative undo/redo** — Y.UndoManager ensures Ctrl+Z only undoes *your* local changes, not remote edits
- **Syntax highlighting** — Monaco Editor (the engine behind VS Code) with per-file language selection
- **Dark mode** — system-aware with flash prevention
- **Persistent rooms** — file content and chat history survive server restarts (PostgreSQL via Prisma)
- **Shareable links** — copy room URL from the header

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind CSS |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| CRDT sync | Y.js + y-monaco + y-websocket |
| Backend | Node.js + Express 4 |
| Real-time | WebSocket (`ws`) — `/yjs/*` for CRDT, `/ws` for chat/presence |
| Database | PostgreSQL + Prisma ORM |
| Monorepo | npm workspaces + `concurrently` |

## Architecture

```
apps/
├── client/          # Vite + React SPA (port 5173)
│   ├── components/
│   │   ├── editor/  # CollaborativeEditor, EditorToolbar
│   │   ├── sidebar/ # FileExplorer, FileItem
│   │   ├── chat/    # ChatPanel, ChatMessage, ChatInput
│   │   ├── presence/# UserList
│   │   └── ui/      # Button, Input, Modal, ThemeToggle
│   ├── hooks/
│   │   ├── useYjs.ts          # Y.Doc + WebsocketProvider per file
│   │   ├── useAwareness.ts    # Remote cursors + user presence
│   │   ├── useFileSystem.ts   # CRDT-synced file manifest + REST CRUD
│   │   └── useChat.ts         # Chat WebSocket + message history
│   └── pages/
│       ├── HomePage.tsx       # Create / join room
│       └── RoomPage.tsx       # Main editor shell
│
└── server/          # Express + WebSocket server (port 3001)
    ├── http/routes/ # REST: /api/rooms, /api/rooms/:id/files, /api/rooms/:id/chat
    ├── ws/
    │   ├── yjsHandler.ts   # y-websocket at /yjs/* (CRDT sync)
    │   └── chatServer.ts   # JSON WebSocket at /ws (chat + presence)
    └── persistence/
        └── yjsPersistence.ts  # setPersistence: load/save Y.js snapshots to DB
```

**WebSocket multiplexing**: a single HTTP server handles two upgrade paths — `/yjs/*` routes to `y-websocket` for binary CRDT frames; `/ws` routes to the chat server for JSON messages.

**Y.js doc naming**: each file gets its own Y.Doc at `room:{roomId}:file:{fileId}`. The file manifest is a shared `Y.Map` inside `room:{roomId}:meta`.

**Persistence**: Y.js snapshots are stored as binary blobs in `YjsDocument` (Prisma). On first client connect, the snapshot is loaded via `bindState`; writes are debounced 5 s and flushed to PostgreSQL on graceful shutdown.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (running locally)

### 1. Clone & install

```bash
git clone <repo-url>
cd live-collaborative-code-editor
npm install
```

### 2. Set up the database

```bash
# Create the database
createdb collab_editor

# Copy the env file and update DATABASE_URL if needed
cp apps/server/.env.example apps/server/.env

# Run migrations
cd apps/server
npx prisma migrate dev
```

The default `DATABASE_URL` uses a Unix socket (works out of the box on Linux with peer auth):

```
DATABASE_URL=postgresql://YOUR_USER@localhost/collab_editor?host=/var/run/postgresql
```

### 3. Run in development

```bash
# From the repo root — starts client (5173) and server (3001) together
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Build for production

```bash
npm run build          # builds both workspaces
cd apps/server && npm start
```

## Environment Variables

`apps/server/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default `3001`) |
| `CLIENT_ORIGIN` | CORS allowed origin (default `http://localhost:5173`) |

## Roadmap

- [ ] GitHub OAuth (anonymous sessions currently)
- [ ] Code execution in a Docker sandbox
- [ ] Voice collaboration via WebRTC
- [ ] Version history / named snapshots
