import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications should behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission and gets the Expo Push Token for this device.
 * @returns {string|null} The push token or null if failed.
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "web") {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "Failed to get push token for push notification! Status:",
        finalStatus,
      );
      return null;
    }

    try {
      // Modern Expo SDKs often need the projectId from constants
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("Successfully retrieved Expo Push Token:", token);
    } catch (e) {
      console.error("Error during getExpoPushTokenAsync:", e);
      return null;
    }
  } else {
    console.log(
      "Push notifications require a physical device. Emulators are not supported.",
    );
    return null;
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
