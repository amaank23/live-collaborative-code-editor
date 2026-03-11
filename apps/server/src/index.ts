import http from "http";
import { config } from "./config";
import { createApp } from "./http/app";

const app = createApp();
const server = http.createServer(app);

server.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
});

// Graceful shutdown (Phase 9 will flesh this out)
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
