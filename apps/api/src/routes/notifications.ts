import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendPushNotifications } from "../services/notifications.js";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const notifications = await prisma.pushNotification.findMany({
      orderBy: { sentAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/notifications/send
router.post("/send", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, body, type, targetUserIds, broadcast, data } = req.body;

    if (!title || !body) {
      res.status(400).json({ error: "Title and body are required" });
      return;
    }

    let tokens: string[] = [];

    if (broadcast) {
      const pushTokens = await prisma.pushToken.findMany();
      tokens = pushTokens.map((t) => t.token);
    } else if (targetUserIds && targetUserIds.length > 0) {
      const pushTokens = await prisma.pushToken.findMany({
        where: { userId: { in: targetUserIds } },
      });
      tokens = pushTokens.map((t) => t.token);
    } else {
      res.status(400).json({ error: "Must specify targetUserIds or set broadcast to true" });
      return;
    }

    tokens = [...new Set(tokens)];

    let sent = 0;
    let failed = 0;

    if (tokens.length > 0) {
      const result = await sendPushNotifications(tokens, { title, body, data: { type: type || "general", ...(data || {}) } });
      sent = result.sent;
      failed = result.failed;
    }

    // Store notification record
    await prisma.pushNotification.create({
      data: {
        title,
        body,
        type: type || "general",
        data: data || {},
        targetUserIds: targetUserIds || [],
        broadcast: broadcast ?? false,
        sentBy: req.user!.sub,
      },
    });

    res.json({ sent, failed });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/notifications/register-token
router.post("/register-token", requireAuth, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    await prisma.pushToken.upsert({
      where: { token },
      update: { userId: req.user!.sub },
      create: { userId: req.user!.sub, token },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Register token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
