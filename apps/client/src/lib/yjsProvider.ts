import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const WS_BASE = "ws://localhost:3001";

/**
 * Creates a Y.js WebsocketProvider for a given doc name.
 * The server handles /yjs/<docName> upgrades.
 */
export function createProvider(
  docName: string,
  ydoc: Y.Doc
): WebsocketProvider {
  return new WebsocketProvider(WS_BASE, `yjs/${docName}`, ydoc, {
    connect: true,
  });
}
