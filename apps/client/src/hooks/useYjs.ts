import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { createProvider } from "../lib/yjsProvider";

export type SyncStatus = "connecting" | "connected" | "disconnected";

export interface UseYjsResult {
  ydoc: Y.Doc | null;
  yText: Y.Text | null;
  provider: WebsocketProvider | null;
  status: SyncStatus;
}

/**
 * Sets up a Y.Doc and WebsocketProvider for a specific file in a room.
 * Cleans up (destroys provider + doc) when roomId/fileId changes or component unmounts.
 */
export function useYjs(
  roomId: string | undefined,
  fileId: string | undefined
): UseYjsResult {
  const [status, setStatus] = useState<SyncStatus>("connecting");

  // Use refs so Monaco binding callbacks always have fresh references
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!roomId || !fileId) return;

    const docName = `room:${roomId}:file:${fileId}`;
    const ydoc = new Y.Doc();
    const provider = createProvider(docName, ydoc);

    ydocRef.current = ydoc;
    providerRef.current = provider;
    forceRender((n) => n + 1);

    provider.on("status", ({ status }: { status: string }) => {
      setStatus(
        status === "connected"
          ? "connected"
          : status === "connecting"
          ? "connecting"
          : "disconnected"
      );
    });

    return () => {
      // Null out awareness before destroying to signal this client left
      provider.awareness.setLocalState(null);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setStatus("connecting");
    };
  }, [roomId, fileId]);

  return {
    ydoc: ydocRef.current,
    yText: ydocRef.current?.getText("content") ?? null,
    provider: providerRef.current,
    status,
  };
}
