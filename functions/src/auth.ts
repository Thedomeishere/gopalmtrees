import { auth } from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const onUserCreated = auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  const userDoc: Record<string, unknown> = {
    email: user.email || "",
    displayName: user.displayName || "",
    phone: user.phoneNumber || "",
    photoURL: user.photoURL || "",
    role: "customer",
    addresses: [],
    fcmTokens: [],
    notificationPreferences: {
      orderUpdates: true,
      promotions: true,
      quoteResponses: true,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(user.uid).set(userDoc);

  console.log(`Created user document for ${user.uid} (${user.email})`);
});
