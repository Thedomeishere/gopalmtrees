import cron from "node-cron";
import { prisma } from "./prisma.js";

export function startCronJobs() {
  // Aggregate daily stats at 2 AM ET
  cron.schedule("0 2 * * *", async () => {
    try {
      await aggregateDailyStats();
    } catch (error) {
      console.error("Daily stats aggregation failed:", error);
    }
  }, { timezone: "America/New_York" });

  console.log("Cron jobs started");
}

export async function aggregateDailyStats() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = yesterday.toISOString().split("T")[0];
  const startOfDay = new Date(dateStr + "T00:00:00.000Z");
  const endOfDay = new Date(dateStr + "T23:59:59.999Z");

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      currentStatus: { notIn: ["cancelled", "refunded"] },
    },
  });

  let revenue = 0;
  let orderCount = 0;
  const productCounts: Record<string, { name: string; quantity: number }> = {};

  for (const order of orders) {
    revenue += order.total;
    orderCount++;

    const items = order.items as any[];
    for (const item of items) {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { name: item.productName, quantity: 0 };
      }
      productCounts[item.productId].quantity += item.quantity;
    }
  }

  const newCustomers = await prisma.user.count({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      role: "customer",
    },
  });

  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10)
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantity: data.quantity,
    }));

  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  await prisma.dailyAnalytics.upsert({
    where: { id: dateStr },
    update: {
      revenue: Math.round(revenue * 100) / 100,
      orderCount,
      newCustomers,
      topProductsJson: topProducts,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    },
    create: {
      id: dateStr,
      date: dateStr,
      revenue: Math.round(revenue * 100) / 100,
      orderCount,
      newCustomers,
      topProductsJson: topProducts,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    },
  });

  console.log(`Daily stats for ${dateStr}: $${revenue.toFixed(2)} revenue, ${orderCount} orders`);
}
