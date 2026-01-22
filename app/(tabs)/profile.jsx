import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PostCard from "../../components/PostCard"; // Reusing the high-quality component
import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";

const MyProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myInfo, setMyInfo] = useState({ uuid: null, name: null });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const uuid = await AsyncStorage.getItem("user_uuid");
      const name = await AsyncStorage.getItem("username");
      setMyInfo({ uuid, name });

      // backend logic for profile_me.php
      const res = await fetch(endpoints.profileMe, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data) {
        // Normalize posts for PostCard expectations
        const normalized = (data.posts || []).map((p) => ({
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
          userInfo: data.user || normalized[0] || null, // Fallback to first post data
        });
      }
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <Image
        source={{
          uri: encodeURI(
            endpoints.baseURL +
              (userProfile?.userInfo?.Profile_photo || "default.png"),
          ),
        }}
        style={styles.bigAvatar}
      />
      <Text style={styles.profileName}>
        {userProfile?.userInfo?.Username || "My Profile"}
      </Text>
      <Text style={styles.profileSub}>
        {userProfile?.userInfo?.Major || "Student"}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {userProfile?.posts?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>
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
            isVisible={true} // Videos play on your own profile too
            onRefresh={fetchProfile}
            currentUserUuid={myInfo.uuid}
            currentUsername={myInfo.name}
          />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                You haven't posted anything yet.
              </Text>
            </View>
          )
        }
      />
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
    marginTop: 50,
  },
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
  emptyText: { color: "#999", fontSize: 16 },
});
