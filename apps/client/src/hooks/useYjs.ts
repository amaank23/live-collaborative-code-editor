import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { createProvider } from "../lib/yjsProvider";

export type SyncStatus = "connecting" | "connected" | "disconnected";

export interface UseYjsResult {
  yText: Y.Text | null;
  provider: WebsocketProvider | null;
  status: SyncStatus;
}

/**
 * Sets up a Y.Doc and WebsocketProvider for a specific file in a room.
 * Uses React state (not refs) so yText/provider are always consistent with fileId.
 */
export function useYjs(
  roomId: string | undefined,
  fileId: string | undefined
): UseYjsResult {
  const [yText, setYText] = useState<Y.Text | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [status, setStatus] = useState<SyncStatus>("connecting");

  useEffect(() => {
    if (!roomId || !fileId) {
      setYText(null);
      setProvider(null);
      setStatus("connecting");
      return;
    }

    const ydoc = new Y.Doc();
    const prov = createProvider(`room:${roomId}:file:${fileId}`, ydoc);
    const text = ydoc.getText("content");

    prov.on("status", ({ status }: { status: string }) => {
      setStatus(
        status === "connected"
          ? "connected"
          : status === "connecting"
          ? "connecting"
          : "disconnected"
      );
    });

    // Both setters are batched in React 18 — one render with correct values
    setYText(text);
    setProvider(prov);
    setStatus("connecting");

    return () => {
      prov.awareness.setLocalState(null);
      prov.destroy();
      ydoc.destroy();
    };
  }, [roomId, fileId]);

  return { yText, provider, status };
}
