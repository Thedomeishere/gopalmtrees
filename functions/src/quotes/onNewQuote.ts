import { firestore } from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const onNewQuote = firestore.onDocumentCreated(
  "quotes/{quoteId}",
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const quoteId = event.params.quoteId;

    console.log(`New quote ${quoteId} from ${data.userEmail}`);

    // Find all admin users and notify them
    const adminsSnapshot = await admin
      .firestore()
      .collection("users")
      .where("role", "==", "admin")
      .get();

    const adminTokens: string[] = [];
    adminsSnapshot.docs.forEach((doc) => {
      const tokens = doc.data().fcmTokens || [];
      adminTokens.push(...tokens);
    });

    if (adminTokens.length > 0) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens: adminTokens,
          notification: {
            title: "New Quote Request",
            body: `${data.userName} requested a ${data.serviceType.replace(/_/g, " ")} quote`,
          },
          data: {
            type: "new_quote",
            quoteId,
          },
        });
      } catch (error) {
        console.error("Error notifying admins about new quote:", error);
      }
    }
  }
);
