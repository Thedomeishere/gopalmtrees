import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "../prisma.js";

const expo = new Expo();

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: "Your order has been confirmed! We're getting it ready.",
  preparing: "Your order is being prepared at our farm.",
  in_transit: "Your order is on its way!",
  delivered: "Your order has been delivered. Enjoy your new plants!",
  cancelled: "Your order has been cancelled.",
  refunded: "Your order has been refunded.",
};

export async function sendPushNotifications(
  tokens: string[],
  notification: { title: string; body: string; data?: Record<string, string> }
): Promise<{ sent: number; failed: number }> {
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  // Filter to valid Expo push tokens
  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return { sent: 0, failed: 0 };

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      for (const receipt of receipts) {
        if (receipt.status === "ok") {
          sent++;
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.error("Push notification error:", error);
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

export async function sendOrderStatusNotification(
  userId: string,
  orderId: string,
  status: string
): Promise<void> {
  const message = STATUS_MESSAGES[status] || `Order status updated to ${status}`;

  const pushTokens = await prisma.pushToken.findMany({
    where: { userId },
  });

  if (pushTokens.length === 0) return;

  const tokens = pushTokens.map((t) => t.token);

  await sendPushNotifications(tokens, {
    title: `Order #${orderId.slice(-6).toUpperCase()}`,
    body: message,
    data: {
      type: "order_update",
      orderId,
      status,
    },
  });
}
