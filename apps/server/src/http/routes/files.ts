import { Router, Request } from "express";
import { prisma } from "../../db/prisma";

const router = Router({ mergeParams: true });

// GET /api/rooms/:roomId/files
router.get("/", async (req: Request<{ roomId: string }>, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { roomId: req.params.roomId },
      orderBy: { createdAt: "asc" },
    });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

export default router;
