import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PostCard from "../components/PostCard";
import endpoints from "../endpoints/endpoints";

const PRIMARY = "#FFD84D";

export default function OtherProfile() {
  const { user_uuid } = useLocalSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [myUuid, setMyUuid] = useState(null);

  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followed, setFollowed] = useState(false);

  const fetchProfileData = async () => {
    if (!user_uuid) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const storedUuid = await AsyncStorage.getItem("user_uuid");
      setMyUuid(storedUuid);

      const url = `${endpoints.profileOther}?user_uuid=${user_uuid}&current_user_uuid=${storedUuid}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.posts) {
        const normalized = data.posts.map((p) => ({
          ...p,
          id: p.id,
          like_count: parseInt(p.like_count || 0),
          is_liked: p.is_liked === 1 || p.is_liked === true,
          is_saved: p.is_saved === 1 || p.is_saved === true,
          media: p.media || [],
        }));

        setPosts(normalized);

        const user =
          data.user || (normalized.length > 0 ? normalized[0] : null);
        if (user) {
          setUserData({
            Username: user.Username,
            Profile_photo: user.Profile_photo,
            Major: user.Major,
          });
        }
      }

      // Check multiple potential keys for follow status to be safe
      const isFollowing = data.isFollowing || data.is_following || false;
      setFollowed(
        isFollowing === true || isFollowing === 1 || isFollowing === "1",
      );
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user_uuid]);

  const handleFollow = async () => {
    if (followLoading) return;
    const wasFollowed = followed;
    setFollowed(!wasFollowed);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(endpoints.follow, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_uuid: user_uuid }),
      });

      const data = await response.json();

      if (data.success) {
        setFollowed(data.action === "followed");
      } else {
        setFollowed(wasFollowed);
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      setFollowed(wasFollowed);
      console.error(error);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Cover Background */}
      <View style={styles.coverSection}>
        <View style={[styles.coverBg, { backgroundColor: PRIMARY }]} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Profile Info Overlay */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                userData?.Profile_photo &&
                userData.Profile_photo.startsWith("http")
                  ? userData.Profile_photo
                  : `${endpoints.baseURL}${userData?.Profile_photo || "default.png"}`.replace(
                      /([^:]\/)\/+/g,
                      "$1",
                    ),
            }}
            style={styles.bigAvatar}
          />
          {followed && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#45BD62" />
            </View>
          )}
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.profileName}>
            {userData?.Username || "Loading..."}
          </Text>
          <Text style={styles.profileSub}>
            {userData?.Major || "University Student"}
          </Text>
        </View>

        {/* Buttons Row */}
        <View style={styles.actionRow}>
          {myUuid !== user_uuid && (
            <TouchableOpacity
              onPress={handleFollow}
              style={[
                styles.followBtn,
                followed ? styles.followedBtn : styles.unfollowedBtn,
              ]}
              disabled={followLoading}
            >
              <Text style={styles.followBtnText}>
                {followed ? "Followed" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.messageBtn}>
            <Ionicons name="mail-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          {/* <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View> */}
        </View>
      </View>

      <View style={styles.sectionDivider} />
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
            isVisible={true}
            onRefresh={fetchProfileData}
            currentUserUuid={myUuid}
          />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={48} color="#ccc" />
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
  headerContainer: {
    backgroundColor: "#fff",
  },
  coverSection: {
    height: 120,
    width: "100%",
    position: "relative",
  },
  coverBg: {
    height: "100%",
    width: "100%",
    opacity: 0.9,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileInfoContainer: {
    alignItems: "center",
    marginTop: -50,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    padding: 3,
    backgroundColor: "#fff",
    borderRadius: 53,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bigAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  nameSection: {
    alignItems: "center",
    marginTop: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  profileSub: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 15,
  },
  followBtn: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 150,
    alignItems: "center",
  },
  unfollowedBtn: {
    backgroundColor: PRIMARY,
  },
  followedBtn: {
    backgroundColor: "#f0f0f0",
  },
  followBtnText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#000",
  },
  messageBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 25,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: "#eee",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  sectionDivider: {
    height: 12,
    backgroundColor: "#f2f2f2",
    width: "100%",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
});
