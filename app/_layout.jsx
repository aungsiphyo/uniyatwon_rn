import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

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

    if (!userSession && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (userSession && inAuthGroup) {
      router.replace("/(tabs)/feed");
    }
  }, [userSession, segments, isLoading, isMounted, navigationState]);

  if (isLoading || !isMounted || !navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFD84D" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. Standard Route Definitions */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />

      {/* 2. FIXED: In Expo Router, do NOT use 'component' prop here */}
      {/* Name must match filename: 'profile' for 'profile.jsx' */}
      <Stack.Screen
        name="profile"
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
