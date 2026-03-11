import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../../db/prisma";

const router = Router();

// POST /api/rooms — create a new room with a default file
router.post("/", async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    const roomId = nanoid(8);

    const room = await prisma.room.create({
      data: {
        id: roomId,
        name: name ?? null,
        files: {
          create: {
            name: "index.js",
            language: "javascript",
          },
        },
      },
      include: { files: true },
    });

    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// GET /api/rooms/:roomId
router.get("/:roomId", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.roomId },
      include: { files: { orderBy: { createdAt: "asc" } } },
    });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    // Update last active timestamp
    await prisma.room.update({
      where: { id: room.id },
      data: { lastActive: new Date() },
    });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get room" });
  }
});

// PATCH /api/rooms/:roomId — rename the room
router.patch("/:roomId", async (req, res) => {
  try {
    const { name } = req.body as { name: string };
    const room = await prisma.room.update({
      where: { id: req.params.roomId },
      data: { name },
    });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update room" });
  }
});

export default router;
