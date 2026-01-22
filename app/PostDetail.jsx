import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import endpoints from "../endpoints/endpoints";
// FIXED: Changed "Post" to "post" to match your actual file name
import Post from "../components/post";

const PRIMARY = "#FFD84D";

export default function PostDetail() {
  const { post_id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState(null);

  useEffect(() => {
    fetchSinglePost();
  }, [post_id]);

  const fetchSinglePost = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const savedUsername = await AsyncStorage.getItem("username");
      setCurrentUsername(savedUsername);

      const res = await fetch(`${endpoints.fetchposts}?post_id=${post_id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      });

      const data = await res.json();
      const postsArray = data.posts || data;

      // Find the specific post
      const foundPost = postsArray.find((p) => (p.id || p.post_id) == post_id);

      if (foundPost) {
        const fixed = {
          id: foundPost.id || foundPost.post_id,
          user_uuid: foundPost.User_uuid || foundPost.user_uuid,
          Username: foundPost.Username || foundPost.user_name || "Unknown",
          Profile_photo:
            foundPost.Profile_photo || foundPost.profile || "default.png",
          Description: foundPost.Description || foundPost.description || "",
          media: Array.isArray(foundPost.media) ? foundPost.media : [],
          Created_at:
            foundPost.Created_at || foundPost.created_at || "Just now",
          like_count: parseInt(foundPost.like_count || 0),
          is_liked: !!(foundPost.is_liked == 1),
          is_saved: !!(foundPost.is_saved == 1),
          comments: Array.isArray(foundPost.comments) ? foundPost.comments : [],
        };
        setPost(fixed);
      }
    } catch (err) {
      console.error("Fetch single post error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={PRIMARY}
            style={{ marginTop: 50 }}
          />
        ) : post ? (
          <Post item={post} currentUsername={currentUsername} />
        ) : (
          <Text style={styles.errorText}>
            Post not found or has been deleted.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  errorText: { textAlign: "center", marginTop: 40, color: "#888" },
});
