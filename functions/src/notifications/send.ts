import { https } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface SendNotificationData {
  title: string;
  body: string;
  type: string;
  targetUserIds?: string[];
  broadcast: boolean;
  data?: Record<string, string>;
}

export const sendPushNotification = https.onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new https.HttpsError("unauthenticated", "Must be signed in");
  }

  // Verify admin
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  if (userDoc.data()?.role !== "admin") {
    throw new https.HttpsError("permission-denied", "Admin access required");
  }

  const data = request.data as SendNotificationData;
  if (!data.title || !data.body) {
    throw new https.HttpsError("invalid-argument", "Title and body are required");
  }

  const db = admin.firestore();
  let tokens: string[] = [];

  if (data.broadcast) {
    // Get all user tokens
    const usersSnapshot = await db.collection("users").get();
    usersSnapshot.docs.forEach((doc) => {
      const userTokens = doc.data().fcmTokens || [];
      tokens.push(...userTokens);
    });
  } else if (data.targetUserIds && data.targetUserIds.length > 0) {
    // Get specific user tokens
    for (const targetUid of data.targetUserIds) {
      const targetDoc = await db.collection("users").doc(targetUid).get();
      const userTokens = targetDoc.data()?.fcmTokens || [];
      tokens.push(...userTokens);
    }
  } else {
    throw new https.HttpsError(
      "invalid-argument",
      "Must specify targetUserIds or set broadcast to true"
    );
  }

  // Deduplicate tokens
  tokens = [...new Set(tokens)];

  if (tokens.length === 0) {
    return { sent: 0, message: "No valid tokens found" };
  }

  // Send in batches of 500 (FCM limit)
  let totalSuccess = 0;
  let totalFailure = 0;

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const response = await admin.messaging().sendEachForMulticast({
      tokens: batch,
      notification: { title: data.title, body: data.body },
      data: {
        type: data.type || "general",
        ...(data.data || {}),
      },
    });
    totalSuccess += response.successCount;
    totalFailure += response.failureCount;
  }

  // Store notification record
  await db.collection("notifications").add({
    title: data.title,
    body: data.body,
    type: data.type || "general",
    data: data.data || {},
    targetUserIds: data.targetUserIds || [],
    broadcast: data.broadcast,
    sentAt: FieldValue.serverTimestamp(),
    sentBy: uid,
  });

  return { sent: totalSuccess, failed: totalFailure };
});
