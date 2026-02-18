import "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";
import { getStorage } from "@react-native-firebase/storage";
import { getMessaging } from "@react-native-firebase/messaging";

// Firebase is auto-initialized from google-services.json / GoogleService-Info.plist
// via the native config files. We just export the service accessors.

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
export const messaging = getMessaging();
