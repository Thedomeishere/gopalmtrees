import { firestore } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: "Your order has been confirmed! We're getting it ready.",
  preparing: "Your order is being prepared at our farm.",
  in_transit: "Your order is on its way!",
  delivered: "Your order has been delivered. Enjoy your new plants!",
  cancelled: "Your order has been cancelled.",
  refunded: "Your order has been refunded.",
};

export const onOrderStatusChange = firestore.onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.currentStatus === after.currentStatus) return;

    const newStatus = after.currentStatus;
    const userId = after.userId;
    const orderId = event.params.orderId;
    const message = STATUS_MESSAGES[newStatus] || `Order status updated to ${newStatus}`;

    // Get user's FCM tokens
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const fcmTokens = userDoc.data()?.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    // Send push notification
    const payload: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: `Order #${orderId.slice(-6).toUpperCase()}`,
        body: message,
      },
      data: {
        type: "order_update",
        orderId,
        status: newStatus,
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(
        `Sent ${response.successCount} notifications for order ${orderId}`
      );

      // Clean up invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === "messaging/invalid-registration-token" ||
            resp.error?.code === "messaging/registration-token-not-registered")
        ) {
          invalidTokens.push(fcmTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .update({
            fcmTokens: FieldValue.arrayRemove(...invalidTokens),
          });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
);
