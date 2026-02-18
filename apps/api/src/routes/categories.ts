import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/categories
router.get("/", async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/categories
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, imageURL, sortOrder, active } = req.body;
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || "",
        imageURL: imageURL || "",
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/categories/:id
router.put("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, imageURL, sortOrder, active } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id as string },
      data: { name, slug, description, imageURL, sortOrder, active },
    });
    res.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
