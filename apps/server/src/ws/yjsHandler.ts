import type { IncomingMessage, Server as HttpServer } from "http";
import type { WebSocket as WsSocket } from "ws";
import type * as Y from "yjs";
import { WebSocketServer } from "ws";

// y-websocket bin/utils is a CommonJS module without TS types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { setupWSConnection } = require("y-websocket/bin/utils") as {
  setupWSConnection: (
    conn: WsSocket,
    req: IncomingMessage,
    opts?: { docName?: string; gc?: boolean }
  ) => void;
  docs: Map<string, Y.Doc>;
};

let wss: WebSocketServer;

export function createYjsServer(httpServer: HttpServer): void {
  wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (socket: WsSocket, request: IncomingMessage) => {
    const url = request.url ?? "";
    // Strip the /yjs/ prefix to get the docName
    const docName = decodeURIComponent(url.slice("/yjs/".length));
    setupWSConnection(socket, request, { docName, gc: true });
  });

  // Attach upgrade handler to HTTP server
  httpServer.on("upgrade", (request: IncomingMessage, socket, head) => {
    const url = request.url ?? "";
    if (url.startsWith("/yjs/")) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // Non-/yjs/ paths (e.g. /ws for chat) are handled by other upgrade listeners
  });

  console.log("[ws] Y.js WebSocket server attached");
}
