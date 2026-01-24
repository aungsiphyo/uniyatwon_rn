import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

import PostCard from "../../components/PostCard";
import { useAuth } from "../../context/AuthContext";
import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";

const MyProfile = () => {
  const { signOut, userSession } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [myInfo, setMyInfo] = useState({ uuid: null, name: null });
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const uuid = await AsyncStorage.getItem("user_uuid");
      const name = await AsyncStorage.getItem("username");
      setMyInfo({ uuid, name });

      const res = await fetch(endpoints.profileMe, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data && data.posts) {
        const normalized = data.posts.map((p) => ({
          ...p,
          id: p.id,
          post_id: p.id,
          like_count: parseInt(p.like_count || 0),
          is_liked: !!(p.is_liked == 1 || p.is_liked === true),
          media: Array.isArray(p.media) ? p.media : [],
        }));

        setUserProfile({
          isOwnProfile: !!data.isOwnProfile,
          posts: normalized,
          userInfo: data.user || (normalized.length > 0 ? normalized[0] : null),
        });
        setRefreshKey(Date.now());
      }
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(endpoints.deletePost, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ Reported_post_id: postId }),
      });

      const data = await res.json();
      if (data.success) {
        // Optimistic UI update or just re-fetch
        setUserProfile((prev) => ({
          ...prev,
          posts: prev.posts.filter((p) => p.id !== postId),
        }));
        Alert.alert("Success", "Post deleted successfully");
      } else {
        Alert.alert("Error", data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      Alert.alert("Error", "Something went wrong while deleting");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, []),
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Cover Background */}
      <View style={styles.coverSection}>
        <View style={[styles.coverBg, { backgroundColor: PRIMARY }]} />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Profile Info Overlay */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                userSession?.Profile_photo &&
                userSession.Profile_photo.startsWith("http")
                  ? userSession.Profile_photo
                  : `${endpoints.baseURL}${userSession?.Profile_photo || "default.png"}`.replace(
                      /([^:]\/)\/+/g,
                      "$1",
                    ),
            }}
            style={styles.bigAvatar}
          />
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.profileName}>
            {userProfile?.userInfo?.Username || "My Profile"}
          </Text>
          <Text style={styles.profileSub}>
            {userProfile?.userInfo?.Major || "University Student"}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/edit_profile")}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {userProfile?.posts?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionDivider} />
    </View>
  );

  if (loading && !userProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={userProfile?.posts || []}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchProfile}
        refreshing={loading}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            isVisible={true}
            onRefresh={fetchProfile}
            onDelete={handleDeletePost}
            currentUserUuid={myInfo.uuid}
            currentUsername={myInfo.name}
          />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                You haven't posted anything yet.
              </Text>
            </View>
          )
        }
      />
      {deleting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      )}
    </View>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  logoutBtn: {
    position: "absolute",
    top: 50,
    right: 20,
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
  editBtn: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 150,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#eee",
  },
  editBtnText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#000",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 25,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
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
