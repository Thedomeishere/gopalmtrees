import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/users
router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        photoURL: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/:id/role
router.put("/:id/role", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (role !== "admin" && role !== "customer") {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/me/profile
router.put("/me/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { displayName, phone, photoURL } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(phone !== undefined && { phone }),
        ...(photoURL !== undefined && { photoURL }),
      },
      include: { addresses: true, notificationPreferences: true },
    });
    const { passwordHash: _, ...profile } = user;
    res.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/me/addresses
router.post("/me/addresses", requireAuth, async (req: Request, res: Response) => {
  try {
    const { label, street, unit, city, state, zip, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.sub },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user!.sub,
        label,
        street,
        unit: unit || null,
        city,
        state,
        zip,
        isDefault: isDefault ?? false,
      },
    });
    res.status(201).json(address);
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/me/addresses/:id
router.put("/me/addresses/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { label, street, unit, city, state, zip, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.sub },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: req.params.id as string },
      data: { label, street, unit, city, state, zip, isDefault },
    });
    res.json(address);
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/me/addresses/:id
router.delete("/me/addresses/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/me/notification-preferences
router.put("/me/notification-preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderUpdates, promotions, quoteResponses } = req.body;
    const prefs = await prisma.notificationPreferences.upsert({
      where: { userId: req.user!.sub },
      update: { orderUpdates, promotions, quoteResponses },
      create: {
        userId: req.user!.sub,
        orderUpdates: orderUpdates ?? true,
        promotions: promotions ?? true,
        quoteResponses: quoteResponses ?? true,
      },
    });
    res.json(prefs);
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
