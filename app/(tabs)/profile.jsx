import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
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
  const [activeProfileTab, setActiveProfileTab] = useState("posts");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const uuid = await AsyncStorage.getItem("user_uuid");
      const name = await AsyncStorage.getItem("Username");
      setMyInfo({ uuid, name });

      let url = endpoints.profileMe;
      let res;

      if (activeProfileTab === "saved") {
        // Fetch saved posts
        res = await fetch(endpoints.fetchSavedPosts, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "UniyatwoonApp/1.0",
          },
        });

        const text = await res.text();
        console.log("Saved Posts Response:", text);

        let data;
        if (!text || text.trim() === "") {
          data = [];
        } else {
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error("JSON Parse Error:", e, "Raw Text:", text);
            return;
          }
        }

        if (Array.isArray(data)) {
          const normalized = data.map((p) => ({
            ...p,
            id: p.post_id, // Use post_id as id for PostCard
            user_uuid: p.user_uuid,
            like_count: parseInt(p.like_count || 0),
            is_liked: !!(p.is_liked == 1 || p.is_liked === true),
            media: Array.isArray(p.media) ? p.media : [],
          }));

          setUserProfile((prev) => ({
            ...prev,
            posts: normalized, // Update only posts
          }));
          setRefreshKey(Date.now());
        }
      } else {
        // Fetch user posts (existing logic)
        res = await fetch(endpoints.profileMe, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "UniyatwoonApp/1.0",
          },
        });

        const text = await res.text();
        console.log("Profile Fetch Response:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("JSON Parse Error:", e, "Raw Text:", text);
          return;
        }

        if (data && data.posts) {
          const normalized = data.posts.map((p) => ({
            ...p,
            id: p.id,
            user_uuid:
              p.user_uuid || p.User_uuid || p.author_uuid || data.user?.uuid,
            like_count: parseInt(p.like_count || 0),
            is_liked: !!(p.is_liked == 1 || p.is_liked === true),
            media: Array.isArray(p.media) ? p.media : [],
          }));

          setUserProfile({
            isOwnProfile: !!data.isOwnProfile,
            posts: normalized,
            userInfo:
              data.user || (normalized.length > 0 ? normalized[0] : null),
          });
          setRefreshKey(Date.now());
        }
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
      console.log("Deleting post with ID:", postId);
      console.log("Request Payload:", { post_id: postId });
      console.log("Delete Post Endpoint:", endpoints.deletePost);
      const res = await fetch(endpoints.deletePost, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id: postId }),
      });

      const data = await res.json();
      console.log("Full Delete Post Response:", data);
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

  // Refetch when active tab changes
  useEffect(() => {
    fetchProfile();
  }, [activeProfileTab]);

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
              uri: (() => {
                const photo =
                  userProfile?.userInfo?.Profile_photo ||
                  userSession?.Profile_photo ||
                  "default.png";
                if (photo.startsWith("http")) return photo;
                return `${endpoints.baseURL}${photo}`.replace(
                  /([^:]\/)\/+/g,
                  "$1",
                );
              })(),
            }}
            style={styles.bigAvatar}
          />
          {/* <Image
            source={require("../../assets/frame.png")}
            style={styles.frame}
          /> */}
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
          {userSession?.is_admin === 1 && (
            <TouchableOpacity
              style={[
                styles.editBtn,
                { backgroundColor: "#000", marginLeft: 10 },
              ]}
              onPress={() => router.push("/admin_broadcast")}
            >
              <Text style={[styles.editBtnText, { color: "#fff" }]}>
                Broadcast
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeProfileTab === "posts" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveProfileTab("posts")}
          >
            <Ionicons
              name="images-outline"
              size={24}
              color={activeProfileTab === "posts" ? PRIMARY : "#999"}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeProfileTab === "posts" && styles.tabButtonLabelActive,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeProfileTab === "saved" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveProfileTab("saved")}
          >
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={activeProfileTab === "saved" ? PRIMARY : "#999"}
            />
            <Text
              style={[
                styles.tabButtonLabel,
                activeProfileTab === "saved" && styles.tabButtonLabelActive,
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <FlatList
          data={userProfile?.posts || []}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchProfile}
          refreshing={loading}
          renderItem={({ item }) => {
            const canDelete = activeProfileTab === "posts";
            console.log("PostCard Render:", {
              postUserUuid: item.user_uuid,
              currentUserUuid: myInfo.uuid,
            });
            return (
              <PostCard
                item={item}
                isVisible={true}
                onRefresh={fetchProfile}
                onDelete={canDelete ? handleDeletePost : null}
                currentUserUuid={myInfo.uuid}
                currentUsername={myInfo.name}
              />
            );
          }}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {activeProfileTab === "posts"
                    ? "You haven't posted anything yet."
                    : "You haven't saved any posts yet."}
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
    </SafeAreaView>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  safeArea: {
    flex: 1,
  },
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
    width: 140,
    height: 140,
    padding: 0,
    backgroundColor: "#fff",
    borderRadius: 90,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    position: "absolute",
    width: 180,
    height: 180,
    top: 0,
    left: 0,
    resizeMode: "contain",
    zIndex: 5,
  },
  bigAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#fff",
    position: "absolute",
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
    justifyContent: "space-around", // Change to space-around for even spacing
    width: "100%",
    marginTop: 25,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tabButton: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  tabButtonLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  tabButtonLabelActive: {
    color: PRIMARY,
    fontWeight: "700",
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
