import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, updateDoc, arrayUnion } from "@react-native-firebase/firestore";
import { messaging, db } from "./firebase";

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.log("Notification permissions not granted");
    return null;
  }

  try {
    // Get FCM token
    const token = await messaging.getToken();

    // Store token in user document
    await updateDoc(doc(db, "users", userId), {
      fcmTokens: arrayUnion(token),
    });

    console.log("FCM token registered:", token.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("Error registering for notifications:", error);
    return null;
  }
}

export function onTokenRefresh(userId: string): () => void {
  return messaging.onTokenRefresh(async (token) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        fcmTokens: arrayUnion(token),
      });
    } catch (error) {
      console.error("Error updating token:", error);
    }
  });
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
