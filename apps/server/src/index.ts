import http from "http";
import { config } from "./config";
import { createApp } from "./http/app";
import { createYjsServer } from "./ws/yjsHandler";
import { initPersistence, flushAll } from "./persistence/yjsPersistence";

// Initialize Y.js PostgreSQL persistence before any docs are created
initPersistence();

const app = createApp();
const server = http.createServer(app);

// Attach Y.js WebSocket server (shares same HTTP port as REST API)
createYjsServer(server);

server.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
});

// Graceful shutdown — flush all pending Y.js snapshots before exit
async function shutdown() {
  console.log("\n🛑 Shutting down — flushing Y.js snapshots...");
  await flushAll();
  server.close(() => {
    console.log("✅ Clean shutdown complete");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
