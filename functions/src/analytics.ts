import { scheduler } from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const aggregateDailyStats = scheduler.onSchedule(
  {
    schedule: "0 2 * * *", // 2 AM daily
    timeZone: "America/New_York",
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
    const startOfDay = new Date(dateStr + "T00:00:00Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    // Get orders for yesterday
    const ordersSnapshot = await db
      .collection("orders")
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    let revenue = 0;
    let orderCount = 0;
    const productCounts: Record<string, { name: string; quantity: number }> = {};

    ordersSnapshot.docs.forEach((doc) => {
      const order = doc.data();
      if (order.currentStatus !== "cancelled" && order.currentStatus !== "refunded") {
        revenue += order.total || 0;
        orderCount++;

        (order.items || []).forEach(
          (item: { productId: string; productName: string; quantity: number }) => {
            if (!productCounts[item.productId]) {
              productCounts[item.productId] = {
                name: item.productName,
                quantity: 0,
              };
            }
            productCounts[item.productId].quantity += item.quantity;
          }
        );
      }
    });

    // Get new customers for yesterday
    const newCustomers = await db
      .collection("users")
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
      .where("role", "==", "customer")
      .count()
      .get();

    // Top products sorted by quantity
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
      }));

    const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    // Save daily analytics
    await db
      .collection("analytics")
      .doc(dateStr)
      .set({
        date: dateStr,
        revenue: Math.round(revenue * 100) / 100,
        orderCount,
        newCustomers: newCustomers.data().count,
        topProducts,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      });

    console.log(
      `Daily stats for ${dateStr}: $${revenue.toFixed(2)} revenue, ${orderCount} orders`
    );
  }
);
