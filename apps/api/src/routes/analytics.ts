import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/analytics?days=30
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const analytics = await prisma.dailyAnalytics.findMany({
      where: { date: { gte: startDateStr } },
      orderBy: { date: "asc" },
    });

    // Map topProductsJson → topProducts for frontend compatibility
    res.json(
      analytics.map((a) => ({
        id: a.id,
        date: a.date,
        revenue: a.revenue,
        orderCount: a.orderCount,
        newCustomers: a.newCustomers,
        topProducts: a.topProductsJson,
        averageOrderValue: a.averageOrderValue,
      }))
    );
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
