import { Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import endpoints from "../../endpoints/endpoints";
import { getTimeAgo } from "../../utils/time";

const PRIMARY = "#FFD84D";

/* ===================== HELPERS ===================== */

const getFullUrl = (path) => {
  if (!path) return null;
  const base = endpoints.baseURL.endsWith("/")
    ? endpoints.baseURL.slice(0, -1)
    : endpoints.baseURL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return encodeURI(`${base}${cleanPath}`);
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(endpoints.notifications, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      // Support both 'notifications' key or direct array response
      const list = data?.notifications || (Array.isArray(data) ? data : []);
      setNotifications(list);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = (item) => {
    // 1. Navigate to details if post_id exists
    if (item.post_id) {
      router.push({
        pathname: "/PostDetail",
        params: { post_id: item.post_id },
      });
    }

    // 2. Logic to mark as read locally (Optional)
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: 1 } : n)),
    );
  };

  const renderItem = ({ item }) => {
    const avatarUrl = getFullUrl(item.from_profile_photo);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          item.is_read == 0 && styles.unreadBackground,
        ]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <FontAwesome name="user" size={24} color="#aaa" />
            </View>
          )}
          {/* Unread indicator dot */}
          {item.is_read == 0 && <View style={styles.unreadDot} />}
        </View>

        {/* Text Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.messageText} numberOfLines={3}>
            <Text style={styles.usernameText}>
              {item.from_username || "Someone"}{" "}
            </Text>
            {item.message || item.Message || "sent you a notification"}
          </Text>
          <Text style={styles.timeText}>
            {getTimeAgo(item.created_at || item.Created_at)}
          </Text>
        </View>

        {/* Chevron for post navigation */}
        {item.post_id && (
          <Feather name="chevron-right" size={18} color="#ddd" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={60} color="#f0f0f0" />
            <Text style={styles.emptyText}>
              Your notifications will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
    letterSpacing: -0.5,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#fafafa",
  },
  unreadBackground: {
    backgroundColor: "#fffdf5", // Very subtle yellow tint for unread
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f0f0f0",
  },
  placeholderAvatar: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  unreadDot: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 8,
  },
  usernameText: {
    fontWeight: "700",
    color: "#1a1a1a",
    fontSize: 15,
  },
  messageText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
  },
  timeText: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 150,
  },
  emptyText: {
    marginTop: 15,
    color: "#bbb",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default NotificationsScreen;
