import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router"; // Use this instead of useRoute
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
// Corrected relative path
import endpoints from "../endpoints/endpoints";

const BASE_URL = endpoints.baseURL;

/* ===================== AUTH HELPER ===================== */
const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== IMAGE HELPER ===================== */
const getCleanUri = (path) => {
  if (!path) return `${BASE_URL}uploads/default-profile.png`;
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${BASE_URL}${encodeURI(cleanPath.trim())}`;
};

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const { user_uuid } = useLocalSearchParams(); // Catch the UUID here

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = user_uuid
          ? `${endpoints.profile}?user_uuid=${user_uuid.trim()}`
          : endpoints.profile;

        const authHeader = await getAuthHeader();
        const res = await fetch(url, {
          method: "GET",
          headers: { ...authHeader, "Content-Type": "application/json" },
        });

        const responseText = await res.text();
        if (!responseText) throw new Error("Empty response");

        const data = JSON.parse(responseText);
        setUserProfile({
          isOwnProfile: !!data.isOwnProfile,
          posts: Array.isArray(data.posts) ? data.posts : [],
          userInfo: data.user || null,
        });
      } catch (err) {
        console.error("Profile Fetch Error:", err);
        setUserProfile({ isOwnProfile: false, posts: [] });
      }
    };

    fetchProfile();
  }, [user_uuid]);

  if (!userProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD84D" />
        <Text style={{ marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header section remains the same */}
      {userProfile.userInfo && (
        <View style={styles.profileHeaderCard}>
          <Image
            source={{ uri: getCleanUri(userProfile.userInfo.Profile_photo) }}
            style={styles.largeAvatar}
          />
          <Text style={styles.headerUsername}>
            {userProfile.userInfo.Username}
          </Text>
          <Text style={styles.headerMajor}>{userProfile.userInfo.Major}</Text>
        </View>
      )}

      {/* Post mapping remains the same */}
      {userProfile.posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.headerRow}>
            <Image
              source={{ uri: getCleanUri(post.Profile_photo) }}
              style={styles.profilePicture}
            />
            <View style={styles.headerText}>
              <Text style={styles.username}>{post.Username}</Text>
              <Text style={styles.major}>{post.Major}</Text>
            </View>
          </View>
          <Text style={styles.description}>{post.Description}</Text>
          <Text style={styles.date}>{post.Created_at}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: "#f8f8f8" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  profileHeaderCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#FFD84D",
  },
  headerUsername: { fontSize: 20, fontWeight: "bold" },
  headerMajor: { color: "#666" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  headerText: { marginLeft: 12 },
  postCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
  },
  username: { fontSize: 16, fontWeight: "bold" },
  major: { color: "#666", fontSize: 12 },
  profilePicture: { width: 45, height: 45, borderRadius: 22.5 },
  description: { fontSize: 14, color: "#333", marginBottom: 8 },
  date: { fontSize: 11, color: "#bbb", marginTop: 5, textAlign: "right" },
});
