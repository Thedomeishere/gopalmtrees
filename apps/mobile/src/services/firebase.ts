import { initializeApp, getApps, getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";
import { getStorage } from "@react-native-firebase/storage";
import { getMessaging } from "@react-native-firebase/messaging";

// Firebase is auto-initialized from google-services.json / GoogleService-Info.plist
// via the native config files. We just export the service accessors.

function app() {
  if (getApps().length === 0) {
    return initializeApp();
  }
  return getApp();
}

export const auth = getAuth(app());
export const db = getFirestore(app());
export const storage = getStorage(app());
export const messaging = getMessaging(app());
