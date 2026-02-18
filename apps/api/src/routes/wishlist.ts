import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/wishlist
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.sub },
      orderBy: { addedAt: "desc" },
    });
    res.json(items);
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/wishlist
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { productId, productName, productImage } = req.body;

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: req.user!.sub,
          productId,
        },
      },
      update: {},
      create: {
        userId: req.user!.sub,
        productId,
        productName,
        productImage: productImage || "",
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/wishlist/:productId
router.delete("/:productId", requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user!.sub,
        productId: req.params.productId,
      },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
