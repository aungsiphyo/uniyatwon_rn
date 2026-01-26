import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import endpoints from "../endpoints/endpoints";

const PostLikes = () => {
  const params = useLocalSearchParams();
  const { post_id } = params;
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("PostLikes Params:", params);
    const fetchLikes = async () => {
      console.log("Fetching likes for post_id:", post_id);
      if (!post_id) return;
      try {
        const token = await AsyncStorage.getItem("token");
        // Try appending to URL as well to cover $_GET/$_REQUEST
        const url = `${endpoints.fetchLikeUsers}?post_id=${post_id}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ post_id: Number(post_id) }),
        });
        const data = await res.json();
        console.log("Likes Fetch Response:", data);
        if (data.success) {
          // API returns "data" array based on logs, fallback to "users" just in case
          setUsers(data.data || data.users || []);
        } else {
          console.error("Fetch likes failed:", data.message);
        }
      } catch (error) {
        console.error("Fetch likes error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (post_id) fetchLikes();
  }, [post_id]);

  const getAvatar = (path) => {
    if (!path || path === "default.png" || path === "") {
      return "https://ui-avatars.com/api/?name=User";
    }
    return encodeURI(`${endpoints.baseURL}${path.trim()}`);
  };

  const handleUserPress = (userUuid) => {
    router.push({
      pathname: "/profile_other",
      params: { user_uuid: userUuid },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Likes</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#FFD84D"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_uuid}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => handleUserPress(item.user_uuid)}
            >
              <Image
                source={{ uri: getAvatar(item.Profile_photo) }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{item.Username}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No likes yet</Text>
          }
        />
      )}
    </View>
  );
};

export default PostLikes;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  listContainer: { padding: 16 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontSize: 15,
  },
});
