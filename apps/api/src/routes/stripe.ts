import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const TAX_RATES: Record<string, number> = {
  NY: 0.08,
  NJ: 0.06625,
  FL: 0.07,
  CT: 0.0635,
  PA: 0.06,
  DEFAULT: 0.08,
};

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia" as any,
  });
}

const router = Router();

// POST /api/stripe/create-payment-intent
router.post("/create-payment-intent", requireAuth, async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, deliveryDate } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const uid = req.user!.sub;

    // Server-side price validation
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { sizes: true, images: true },
      });

      if (!product) {
        res.status(404).json({ error: `Product ${item.productId} not found` });
        return;
      }
      if (!product.active) {
        res.status(400).json({ error: `Product "${product.name}" is no longer available` });
        return;
      }

      const size = product.sizes.find((s) => s.id === item.sizeId);
      if (!size) {
        res.status(404).json({ error: `Size ${item.sizeId} not found for ${product.name}` });
        return;
      }
      if (size.stock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${product.name}" (${size.label}). Only ${size.stock} available.`,
        });
        return;
      }

      subtotal += size.price * item.quantity;
      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        productImage: product.thumbnailURL || (product.images[0]?.url ?? ""),
        sizeId: item.sizeId,
        sizeLabel: size.label,
        price: size.price,
        quantity: item.quantity,
      });
    }

    const state = shippingAddress?.state || "NY";
    const taxRate = TAX_RATES[state] ?? TAX_RATES.DEFAULT;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const deliveryFee = 0;
    const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;
    const amountInCents = Math.round(total * 100);

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({ where: { id: uid } });
    let stripeCustomerId = user?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: user?.email,
        metadata: { userId: uid },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: uid },
        data: { stripeCustomerId },
      });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      customer: stripeCustomerId,
      metadata: {
        userId: uid,
        itemCount: validatedItems.length.toString(),
        deliveryDate: deliveryDate || "",
      },
    });

    // Store pending order
    await prisma.pendingOrder.create({
      data: {
        id: paymentIntent.id,
        userId: uid,
        userEmail: user?.email || "",
        items: validatedItems,
        subtotal,
        tax,
        deliveryFee,
        total,
        shippingAddress,
        deliveryDate: deliveryDate || null,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      tax,
      deliveryFee,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/stripe/webhook
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded`);

      const pending = await prisma.pendingOrder.findUnique({
        where: { id: paymentIntent.id },
      });

      if (!pending) {
        console.error(`No pending order found for ${paymentIntent.id}`);
        break;
      }

      const items = pending.items as any[];

      await prisma.$transaction(async (tx) => {
        // Create the order
        await tx.order.create({
          data: {
            userId: pending.userId,
            userEmail: pending.userEmail,
            items: pending.items,
            subtotal: pending.subtotal,
            tax: pending.tax,
            deliveryFee: pending.deliveryFee,
            total: pending.total,
            shippingAddress: pending.shippingAddress as any,
            deliveryDate: pending.deliveryDate ? new Date(pending.deliveryDate) : null,
            statusHistory: [
              {
                status: "confirmed",
                timestamp: new Date().toISOString(),
                note: "Payment received",
              },
            ],
            currentStatus: "confirmed",
            stripePaymentIntentId: paymentIntent.id,
          },
        });

        // Reduce stock
        for (const item of items) {
          const sizes = await tx.productSize.findMany({
            where: { productId: item.productId, id: item.sizeId },
          });
          if (sizes.length > 0) {
            await tx.productSize.update({
              where: { id: item.sizeId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }

        // Clear user's cart
        await tx.cart.deleteMany({ where: { userId: pending.userId } });

        // Delete pending order
        await tx.pendingOrder.delete({ where: { id: paymentIntent.id } });
      });

      console.log(`Order created for user ${pending.userId}`);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} failed`);
      await prisma.pendingOrder.deleteMany({ where: { id: paymentIntent.id } });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
