import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import endpoints from "../endpoints/endpoints";

// FIXED: Use curly braces because it's now a named export from feed.jsx
import PostCard from "../components/PostCard";
const PRIMARY = "#FFD84D";

export default function OtherProfile() {
  const { user_uuid } = useLocalSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [myUuid, setMyUuid] = useState(null);
  const [myName, setMyName] = useState(null);

  const fetchProfileData = async () => {
    if (!user_uuid) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const storedUuid = await AsyncStorage.getItem("user_uuid");
      const storedName = await AsyncStorage.getItem("username");

      setMyUuid(storedUuid);
      setMyName(storedName);

      // This hits your PHP which already uses WHERE p.user_uuid = ?
      const res = await fetch(
        `${endpoints.profileOther}?user_uuid=${user_uuid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (data.posts) {
        // Normalize for the Post component
        const normalized = data.posts.map((p) => ({
          ...p,
          id: p.id,
          post_id: p.id,
          like_count: parseInt(p.like_count || 0),
          is_liked: p.is_liked === 1 || p.is_liked === true,
          media: p.media || [],
        }));

        setPosts(normalized);

        // Pull user info from the first post found
        if (normalized.length > 0) {
          setUserData({
            Username: normalized[0].Username,
            Profile_photo: normalized[0].Profile_photo,
            Major: normalized[0].Major,
          });
        }
      }
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user_uuid]);

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <Image
        source={{
          uri: encodeURI(
            endpoints.baseURL + (userData?.Profile_photo || "default.png"),
          ),
        }}
        style={styles.bigAvatar}
      />
      <Text style={styles.profileName}>
        {userData?.Username || "User Profile"}
      </Text>
      <Text style={styles.profileSub}>
        {userData?.Major || "University Student"}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{posts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            isVisible={true} // Usually always true for profile focus
            onRefresh={fetchProfileData}
            currentUserUuid={myUuid} // Make sure to pass your logged in UUID
          />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet.</Text>
            </View>
          )
        }
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  bigAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: PRIMARY,
    marginBottom: 10,
  },
  profileName: { fontSize: 20, fontWeight: "700" },
  profileSub: { fontSize: 14, color: "#888" },
  statsRow: { flexDirection: "row", marginTop: 20 },
  statItem: { alignItems: "center", marginHorizontal: 20 },
  statNumber: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 12, color: "#888" },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#999" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
