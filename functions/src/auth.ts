import { identity } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const onUserCreated = identity.beforeUserCreated(async (event) => {
  const user = event.data!;
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
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(user.uid).set(userDoc);

  console.log(`Created user document for ${user.uid} (${user.email})`);
});
