import { https } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
}

export const stripeWebhook = https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;
  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    event = getStripe().webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  const db = admin.firestore();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded`);

      // Get pending order data
      const pendingDoc = await db
        .collection("pendingOrders")
        .doc(paymentIntent.id)
        .get();

      if (!pendingDoc.exists) {
        console.error(`No pending order found for ${paymentIntent.id}`);
        break;
      }

      const pending = pendingDoc.data()!;

      // Create the order
      const orderRef = db.collection("orders").doc();
      const now = FieldValue.serverTimestamp();

      await orderRef.set({
        userId: pending.userId,
        userEmail: pending.userEmail,
        items: pending.items,
        subtotal: pending.subtotal,
        tax: pending.tax,
        deliveryFee: pending.deliveryFee,
        total: pending.total,
        shippingAddress: pending.shippingAddress,
        deliveryDate: pending.deliveryDate,
        statusHistory: [
          {
            status: "confirmed",
            timestamp: Timestamp.now(),
            note: "Payment received",
          },
        ],
        currentStatus: "confirmed",
        stripePaymentIntentId: paymentIntent.id,
        createdAt: now,
        updatedAt: now,
      });

      // Reduce stock for each item
      const batch = db.batch();
      for (const item of pending.items) {
        const productRef = db.collection("products").doc(item.productId);
        const productDoc = await productRef.get();
        if (productDoc.exists) {
          const sizes = productDoc.data()!.sizes.map(
            (s: { id: string; stock: number }) =>
              s.id === item.sizeId
                ? { ...s, stock: Math.max(0, s.stock - item.quantity) }
                : s
          );
          batch.update(productRef, { sizes });
        }
      }

      // Clear the user's cart
      batch.delete(db.collection("carts").doc(pending.userId));

      // Delete the pending order
      batch.delete(pendingDoc.ref);

      await batch.commit();

      console.log(`Order ${orderRef.id} created for user ${pending.userId}`);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} failed`);
      // Clean up pending order
      await db.collection("pendingOrders").doc(paymentIntent.id).delete();
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});
