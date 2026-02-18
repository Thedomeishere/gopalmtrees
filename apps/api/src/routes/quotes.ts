import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/quotes
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const where = req.user!.role === "admin" ? {} : { userId: req.user!.sub };
    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(quotes);
  } catch (error) {
    console.error("Get quotes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/quotes
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { serviceType, description, photos, contactPreference, phone } = req.body;

    const quote = await prisma.quote.create({
      data: {
        userId: req.user!.sub,
        userEmail: user.email,
        userName: user.displayName,
        serviceType,
        description,
        photos: photos || [],
        contactPreference: contactPreference || "email",
        phone: phone || null,
      },
    });

    res.status(201).json(quote);
  } catch (error) {
    console.error("Create quote error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/quotes/:id
router.put("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, adminResponse, estimatedPrice } = req.body;

    const quote = await prisma.quote.update({
      where: { id: req.params.id as string },
      data: {
        ...(status && { status }),
        ...(adminResponse !== undefined && { adminResponse }),
        ...(estimatedPrice !== undefined && { estimatedPrice }),
      },
    });

    res.json(quote);
  } catch (error) {
    console.error("Update quote error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
