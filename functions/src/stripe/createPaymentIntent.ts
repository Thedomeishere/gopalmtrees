import { https } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const TAX_RATES: Record<string, number> = {
  NY: 0.08,
  NJ: 0.06625,
  FL: 0.07,
  CT: 0.0635,
  PA: 0.06,
  DEFAULT: 0.08,
};

interface CartItem {
  productId: string;
  sizeId: string;
  quantity: number;
}

interface PaymentRequest {
  items: CartItem[];
  shippingAddress: {
    state: string;
    street: string;
    city: string;
    zip: string;
  };
  deliveryDate?: string;
}

export const createPaymentIntent = https.onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new https.HttpsError("unauthenticated", "Must be signed in");
  }

  const data = request.data as PaymentRequest;
  if (!data.items || data.items.length === 0) {
    throw new https.HttpsError("invalid-argument", "Cart is empty");
  }

  const db = admin.firestore();

  // Server-side price validation — never trust client prices
  let subtotal = 0;
  const validatedItems: Array<{
    productId: string;
    productName: string;
    productImage: string;
    sizeId: string;
    sizeLabel: string;
    price: number;
    quantity: number;
  }> = [];

  for (const item of data.items) {
    const productDoc = await db.collection("products").doc(item.productId).get();
    if (!productDoc.exists) {
      throw new https.HttpsError("not-found", `Product ${item.productId} not found`);
    }

    const product = productDoc.data()!;
    if (!product.active) {
      throw new https.HttpsError(
        "failed-precondition",
        `Product "${product.name}" is no longer available`
      );
    }

    const size = product.sizes?.find((s: { id: string }) => s.id === item.sizeId);
    if (!size) {
      throw new https.HttpsError(
        "not-found",
        `Size ${item.sizeId} not found for ${product.name}`
      );
    }

    if (size.stock < item.quantity) {
      throw new https.HttpsError(
        "failed-precondition",
        `Insufficient stock for "${product.name}" (${size.label}). Only ${size.stock} available.`
      );
    }

    subtotal += size.price * item.quantity;
    validatedItems.push({
      productId: item.productId,
      productName: product.name,
      productImage: product.thumbnailURL || product.images?.[0] || "",
      sizeId: item.sizeId,
      sizeLabel: size.label,
      price: size.price,
      quantity: item.quantity,
    });
  }

  const state = data.shippingAddress.state || "NY";
  const taxRate = TAX_RATES[state] ?? TAX_RATES.DEFAULT;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const deliveryFee = 0;
  const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;
  const amountInCents = Math.round(total * 100);

  // Get or create Stripe customer
  const userDoc = await db.collection("users").doc(uid).get();
  let stripeCustomerId = userDoc.data()?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: userDoc.data()?.email,
      metadata: { firebaseUid: uid },
    });
    stripeCustomerId = customer.id;
    await db.collection("users").doc(uid).update({ stripeCustomerId });
  }

  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    customer: stripeCustomerId,
    metadata: {
      firebaseUid: uid,
      itemCount: validatedItems.length.toString(),
      deliveryDate: data.deliveryDate || "",
    },
  });

  // Store pending order data for webhook to use
  await db
    .collection("pendingOrders")
    .doc(paymentIntent.id)
    .set({
      userId: uid,
      userEmail: userDoc.data()?.email || "",
      items: validatedItems,
      subtotal,
      tax,
      deliveryFee,
      total,
      shippingAddress: data.shippingAddress,
      deliveryDate: data.deliveryDate || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: total,
    tax,
    deliveryFee,
  };
});
