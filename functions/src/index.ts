import * as admin from "firebase-admin";

admin.initializeApp();

// Auth triggers
export { onUserCreated } from "./auth";

// Stripe / Payments
export { createPaymentIntent } from "./stripe/createPaymentIntent";
export { stripeWebhook } from "./stripe/webhook";

// Order triggers
export { onOrderStatusChange } from "./orders/onStatusChange";

// Quote triggers
export { onNewQuote } from "./quotes/onNewQuote";

// Notifications
export { sendPushNotification } from "./notifications/send";

// Analytics
export { aggregateDailyStats } from "./analytics";
