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

// POST /api/rooms/:roomId/files
router.post("/", async (req: Request<{ roomId: string }>, res) => {
  const { name, language = "javascript" } = req.body as {
    name: string;
    language?: string;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "File name is required" });
    return;
  }
  try {
    const file = await prisma.file.create({
      data: { roomId: req.params.roomId, name: name.trim(), language },
    });
    res.status(201).json(file);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      res.status(409).json({ error: "A file with that name already exists" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create file" });
  }
});

// PATCH /api/rooms/:roomId/files/:fileId
router.patch(
  "/:fileId",
  async (req: Request<{ roomId: string; fileId: string }>, res) => {
    const { name, language } = req.body as {
      name?: string;
      language?: string;
    };
    const updates: { name?: string; language?: string } = {};
    if (name !== undefined) updates.name = name.trim();
    if (language !== undefined) updates.language = language;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    try {
      const file = await prisma.file.update({
        where: { id: req.params.fileId },
        data: updates,
      });
      res.json(file);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        res.status(409).json({ error: "A file with that name already exists" });
        return;
      }
      if (code === "P2025") {
        res.status(404).json({ error: "File not found" });
        return;
      }
      console.error(err);
      res.status(500).json({ error: "Failed to update file" });
    }
  }
);

// DELETE /api/rooms/:roomId/files/:fileId
router.delete(
  "/:fileId",
  async (req: Request<{ roomId: string; fileId: string }>, res) => {
    try {
      await prisma.file.delete({ where: { id: req.params.fileId } });
      res.status(204).end();
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "P2025") {
        res.status(404).json({ error: "File not found" });
        return;
      }
      console.error(err);
      res.status(500).json({ error: "Failed to delete file" });
    }
  }
);

export default router;
