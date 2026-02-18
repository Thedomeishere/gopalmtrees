import { Router, Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendOrderStatusNotification } from "../services/notifications.js";
import type { OrderStatusEntry } from "../types.js";

const router = Router();

// GET /api/orders
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const where = req.user!.role === "admin" ? {} : { userId: req.user!.sub };
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (req.user!.role !== "admin" && order.userId !== req.user!.sub) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/orders/:id/status
router.put("/:id/status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const statusHistory = (order.statusHistory as unknown) as OrderStatusEntry[];
    statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status changed to ${status}`,
    });

    const updated = await prisma.order.update({
      where: { id: req.params.id as string },
      data: {
        currentStatus: status,
        statusHistory: statusHistory as unknown as Prisma.InputJsonValue,
      },
    });

    // Send push notification (fire-and-forget)
    sendOrderStatusNotification(order.userId, req.params.id as string, status).catch(console.error);

    res.json(updated);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/orders/:id/refund
router.post("/:id/refund", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (amount <= 0 || amount > order.total) {
      res.status(400).json({ error: "Invalid refund amount" });
      return;
    }

    const statusHistory = (order.statusHistory as unknown) as OrderStatusEntry[];
    statusHistory.push({
      status: "refunded",
      timestamp: new Date().toISOString(),
      note: `Refund of $${amount.toFixed(2)} issued`,
    });

    const updated = await prisma.order.update({
      where: { id: req.params.id as string },
      data: {
        currentStatus: "refunded",
        refundAmount: amount,
        statusHistory: statusHistory as unknown as Prisma.InputJsonValue,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Refund order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/orders/bulk-status
router.put("/bulk-status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderIds, status, note } = req.body;
    if (!Array.isArray(orderIds) || !status) {
      res.status(400).json({ error: "orderIds array and status required" });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });

    const updates = orders.map((order) => {
      const statusHistory = (order.statusHistory as unknown) as OrderStatusEntry[];
      statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Bulk status change to ${status}`,
      });
      return prisma.order.update({
        where: { id: order.id },
        data: { currentStatus: status, statusHistory: statusHistory as unknown as Prisma.InputJsonValue },
      });
    });

    await Promise.all(updates);
    res.json({ success: true, updated: orderIds.length });
  } catch (error) {
    console.error("Bulk status update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
