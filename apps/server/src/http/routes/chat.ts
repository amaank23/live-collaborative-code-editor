import { Router } from "express";
import { prisma } from "../../db/prisma";

const router = Router({ mergeParams: true });

// GET /api/rooms/:roomId/chat — fetch last 100 messages
router.get("/", async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { roomId: req.params.roomId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

export default router;
