import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          const adjustedSize = 26; // Refined icon size

          if (route.name === "feed") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "create") {
            iconName = "add";
            return (
              <View style={styles.createButtonContainer}>
                <View style={styles.createButton}>
                  <Ionicons name={iconName} size={32} color="#000" />
                </View>
              </View>
            );
          } else if (route.name === "noti") {
            // Updated these lines for Notification Bell icons
            iconName = focused ? "notifications" : "notifications-outline";
          } else if (route.name === "profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={adjustedSize} color={color} />;
        },
        tabBarActiveTintColor: "#FFD84D",
        tabBarInactiveTintColor: "#8e8e93",
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e5e5",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2, // Fine-tuned gap
        },
      })}
    >
      <Tabs.Screen name="feed" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen name="noti" options={{ title: "Noti" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    top: -31, // Half of 62, aligning center to top edge
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFD84D",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
