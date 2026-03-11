import express from "express";
import cors from "cors";
import roomsRouter from "./routes/rooms";
import filesRouter from "./routes/files";
import chatRouter from "./routes/chat";

export function createApp() {
  const app = express();

  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/rooms", roomsRouter);
  app.use("/api/rooms/:roomId/files", filesRouter);
  app.use("/api/rooms/:roomId/chat", chatRouter);

  return app;
}
