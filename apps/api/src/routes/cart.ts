import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/cart
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.sub },
      include: { items: true },
    });

    if (!cart) {
      res.json({ userId: req.user!.sub, items: [], updatedAt: new Date().toISOString() });
      return;
    }

    res.json({
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        sizeId: item.sizeId,
        sizeLabel: item.sizeLabel,
        price: item.price,
        quantity: item.quantity,
      })),
      updatedAt: cart.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/cart
router.put("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    // Delete existing cart and items, then recreate
    await prisma.cart.deleteMany({ where: { userId: req.user!.sub } });

    if (!items || items.length === 0) {
      res.json({ userId: req.user!.sub, items: [], updatedAt: new Date().toISOString() });
      return;
    }

    const cart = await prisma.cart.create({
      data: {
        userId: req.user!.sub,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage || "",
            sizeId: item.sizeId,
            sizeLabel: item.sizeLabel,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    res.json({
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      updatedAt: cart.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart
router.delete("/", requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.cart.deleteMany({ where: { userId: req.user!.sub } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
