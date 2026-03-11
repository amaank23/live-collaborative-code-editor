import * as Y from "yjs";
import { prisma } from "../db/prisma";

// Maps docName → pending debounce timer
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();
// Maps docName → Y.Doc for graceful shutdown flush
const activeDocs = new Map<string, Y.Doc>();

const SAVE_DEBOUNCE_MS = 5000;

// docName format: "room:ROOMID:file:FILEID"
function parseDocName(docName: string): { roomId: string; fileId: string } | null {
  const parts = docName.split(":");
  if (parts.length === 4 && parts[0] === "room" && parts[2] === "file") {
    return { roomId: parts[1], fileId: parts[3] };
  }
  return null;
}

export async function loadSnapshot(docName: string, ydoc: Y.Doc): Promise<void> {
  const parsed = parseDocName(docName);
  if (!parsed) return; // meta doc or unknown — skip

  activeDocs.set(docName, ydoc);

  try {
    const record = await prisma.yjsDocument.findUnique({
      where: { fileId: parsed.fileId },
    });

    if (record?.snapshot) {
      Y.applyUpdate(ydoc, new Uint8Array(record.snapshot));
    }
  } catch (err) {
    console.error(`[persistence] Failed to load snapshot for ${docName}:`, err);
  }

  // Wire up periodic saves on future updates
  ydoc.on("update", () => scheduleSave(docName, ydoc));
}

export function scheduleSave(docName: string, ydoc: Y.Doc): void {
  const existing = pendingSaves.get(docName);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingSaves.delete(docName);
    flushDoc(docName, ydoc).catch((err) =>
      console.error(`[persistence] Failed to save ${docName}:`, err)
    );
  }, SAVE_DEBOUNCE_MS);

  pendingSaves.set(docName, timer);
}

async function flushDoc(docName: string, ydoc: Y.Doc): Promise<void> {
  const parsed = parseDocName(docName);
  if (!parsed) return;

  const snapshot = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  await prisma.yjsDocument.upsert({
    where: { fileId: parsed.fileId },
    create: { roomId: parsed.roomId, fileId: parsed.fileId, snapshot },
    update: { snapshot, updatedAt: new Date() },
  });
}

/** Called on SIGINT/SIGTERM — flush all pending saves immediately */
export async function flushAll(): Promise<void> {
  // Cancel all pending timers
  for (const [docName, timer] of pendingSaves) {
    clearTimeout(timer);
    const ydoc = activeDocs.get(docName);
    if (ydoc) {
      await flushDoc(docName, ydoc).catch((err) =>
        console.error(`[persistence] Shutdown flush failed for ${docName}:`, err)
      );
    }
  }
  pendingSaves.clear();
  activeDocs.clear();
}

/** Register with y-websocket's setPersistence */
export function initPersistence(): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { setPersistence } = require("y-websocket/bin/utils") as {
    setPersistence: (p: {
      provider: null;
      bindState: (docName: string, ydoc: Y.Doc) => Promise<void>;
      writeState: (docName: string, ydoc: Y.Doc) => Promise<void>;
    }) => void;
  };

  setPersistence({
    provider: null,
    bindState: loadSnapshot,
    writeState: async (docName, ydoc) => {
      await flushDoc(docName, ydoc);
    },
  });

  console.log("[persistence] Y.js PostgreSQL persistence initialized");
}
