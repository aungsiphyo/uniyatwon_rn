import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import endpoints, { BASE_URL } from "../../endpoints/endpoints";

/* ===================== AUTH HELPER ===================== */
const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== IMAGE HELPER ===================== */
// Cleans up double slashes and ensures the URI is safe
const getCleanUri = (path) => {
  if (!path) return `${BASE_URL}/uploads/default-profile.png`;
  // Remove leading slash if it exists to avoid http://ip.com//uploads
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${BASE_URL}/${encodeURI(cleanPath.trim())}`;
};

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const route = useRoute();
  const deletePost = async (postId) => {
    const token = await AsyncStorage.getItem("token");

    const formData = new FormData();
    formData.append("Reported_post_id", postId);

    const res = await fetch(endpoints.deletePost, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // ❌ DO NOT set Content-Type manually
      },
      body: formData,
    });

    const data = await res.json();
    console.log("DELETE RESPONSE:", data);
  };

  // Receives user_uuid from the navigation.navigate("Profile", { user_uuid }) call
  const user_uuid = route.params?.user_uuid;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Construct URL: If user_uuid exists, we are viewing someone else.
        // If not, the backend should return the logged-in user's profile based on the token.
        const url = user_uuid
          ? `${endpoints.profile}?user_uuid=${user_uuid.trim()}`
          : endpoints.profile;

        const authHeader = await getAuthHeader();

        const res = await fetch(url, {
          method: "GET",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
        });

        // Safe JSON parsing to catch "Unexpected end of input"
        const responseText = await res.text();
        if (!responseText) throw new Error("Empty response from server");

        const data = JSON.parse(responseText);
        console.log("PROFILE RESPONSE:", data);

        setUserProfile({
          isOwnProfile: !!data.isOwnProfile,
          // Handle the case where the user has no posts yet
          posts: Array.isArray(data.posts) ? data.posts : [],
          // You might want to store user info separately if your PHP returns it
          userInfo: data.user || null,
        });
      } catch (err) {
        console.error("Profile Fetch Error:", err);
        setUserProfile({ isOwnProfile: false, posts: [] });
      }
    };

    fetchProfile();
  }, [user_uuid]); // Re-runs if the user clicks a different username

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
      {userProfile.posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            This user hasn't posted anything yet.
          </Text>
        </View>
      ) : (
        userProfile.posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.headerRow}>
              {/* LEFT SIDE (profile info) */}
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <Image
                  source={{ uri: getCleanUri(post.Profile_photo) }}
                  style={styles.profilePicture}
                />
                <View style={styles.headerText}>
                  <Text style={styles.username}>{post.Username}</Text>
                  <Text style={styles.major}>{post.Major}</Text>
                </View>
              </View>

              {/* RIGHT SIDE (delete icon) */}
              {userProfile.isOwnProfile && (
                <TouchableOpacity onPress={() => deletePost(post.id)}>
                  <Ionicons name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.description}>{post.Description}</Text>

            {/* ===================== MEDIA ===================== */}
            {Array.isArray(post.media) && post.media.length > 0 && (
              <View style={styles.mediaContainer}>
                {post.media.map((m, index) =>
                  m.Media_type === "image" ? (
                    <Image
                      key={index}
                      source={{ uri: getCleanUri(m.Media_url) }}
                      style={styles.mediaImage}
                    />
                  ) : (
                    <View key={index} style={styles.videoPlaceholder}>
                      <Text>🎥 Video Content</Text>
                    </View>
                  ),
                )}
              </View>
            )}

            <Text style={styles.date}>{post.Created_at}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f8f8f8",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerText: {
    marginLeft: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
    fontSize: 16,
  },
  postCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  major: {
    color: "#666",
    fontSize: 12,
  },
  profilePicture: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: "#FFD84D",
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  mediaContainer: {
    marginTop: 5,
  },
  mediaImage: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: "cover",
  },
  videoPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    color: "#bbb",
    marginTop: 5,
    textAlign: "right",
  },
});
