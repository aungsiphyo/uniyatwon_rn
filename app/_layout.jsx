import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import endpoints from "../endpoints/endpoints";
import { registerForPushNotificationsAsync } from "../utils/notifications";

function StackLayout() {
  const { userSession, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading || !isMounted || !navigationState?.key) return;

    const inAuthGroup = segments[0] === "auth";

    // ✅ ADD THIS LINE — allow postDetail route
    const inPostDetail = segments[0] === "postDetail";

    if (!userSession && !inAuthGroup) {
      router.replace("/auth/signup");
    }
    // ✅ Prevent redirect loop when opening post detail
    else if (userSession && inAuthGroup) {
      router.replace("/(tabs)/feed");
    }
  }, [userSession, segments, isLoading, isMounted, navigationState]);

  // Handle Push Notification Registration
  useEffect(() => {
    if (userSession && isMounted) {
      const handleRegistration = async () => {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            const res = await fetch(endpoints.savePushToken, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userSession.token}`,
              },
              body: JSON.stringify({
                user_uuid: userSession.user_uuid,
                push_token: token,
              }),
            });

            const data = await res.json();
            if (!data.success) {
              console.error("Server failed to save push token:", data.message);
            }
          }
        } catch (err) {
          console.error("Push Registration Error:", err);
        }
      };

      handleRegistration();
    }
  }, [userSession, isMounted]);

  if (isLoading || !isMounted || !navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD84D" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />

      <Stack.Screen
        name="profile_other"
        options={{
          headerShown: true,
          title: "User Profile",
          headerTintColor: "#000",
          headerStyle: { backgroundColor: "#FFD84D" },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StackLayout />
    </AuthProvider>
  );
}
