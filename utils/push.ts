import Constants from "expo-constants";
import * as Device from "expo-device";
import { isRunningInExpoGo } from "expo";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import api from "../services/api";
import * as storage from "./storage";

// Phone push notifications. They only work in the installed app (the APK):
// Expo Go on Android no longer supports them (and shows a red error if you
// try), and the browser build has no push either. There, everything below
// quietly does nothing and the app keeps checking every 30 seconds instead.
export const pushSupported = Platform.OS !== "web" && !isRunningInExpoGo();

// Same id the server sends with every push (App\Support\ExpoPush)
const CHANNEL_ID = "default";

if (pushSupported) {
  // Also show the banner while the app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Ask for permission and tell the server this phone's push address. */
export async function registerForPush(): Promise<void> {
  if (!pushSupported || !Device.isDevice) return;
  try {
    if (Platform.OS === "android") {
      // Android 13+: the channel must exist before asking for the token
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "FoundationLink",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return; // the donor said no: in-app notifications still work

    // Set by `eas init` (app.json -> extra.eas.projectId)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.log("Push notifications: no EAS projectId yet (run `eas init`).");
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post("/donor/push-token", { token });
    await storage.setItemAsync("pushToken", token);
  } catch (err) {
    // Never block login over push problems
    console.log("Push notifications not set up:", err);
  }
}

/** On logout: stop pushes to this phone. Must run while still logged in. */
export async function unregisterForPush(): Promise<void> {
  const token = await storage.getItemAsync("pushToken");
  if (!token) return;
  try {
    await api.delete("/donor/push-token", { data: { token } });
  } catch {
    // offline: the server forgets it when someone else logs in on this phone
  }
  await storage.deleteItemAsync("pushToken");
}

/** Run `callback` whenever a push arrives while the app is open. */
export function onPushReceived(callback: () => void): () => void {
  if (!pushSupported) return () => {};
  const sub = Notifications.addNotificationReceivedListener(callback);
  return () => sub.remove();
}
