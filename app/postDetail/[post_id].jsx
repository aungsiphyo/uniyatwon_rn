import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import PostCard from "../../components/PostCard";
import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";

export default function PostDetail() {
  const { post_id } = useLocalSearchParams(); // comes from /postDetail/123
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [currentUuid, setCurrentUuid] = useState(null);

  const fetchSinglePost = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const savedUsername = await AsyncStorage.getItem("username");
      const savedUuid = await AsyncStorage.getItem("user_uuid");

      setCurrentUsername(savedUsername);
      setCurrentUuid(savedUuid);

      const res = await fetch(
        `${endpoints.fetchDetailPost}?post_id=${post_id}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            Accept: "application/json",
          },
        },
      );

      const data = await res.json();

      if (!data.success || !data.post) {
        setPost(null);
        return;
      }

      const foundPost = data.post;

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
          is_liked: Number(foundPost.is_liked) === 1,
          is_saved: Number(foundPost.is_saved) === 1,
          comments: Array.isArray(foundPost.comments) ? foundPost.comments : [],
        };

        setPost(fixed);
      } else {
        setPost(null);
      }
    } catch (err) {
      console.error("Fetch single post error:", err);
    } finally {
      setLoading(false);
    }
  }, [post_id]);

  // ✅ Only depend on post_id
  useEffect(() => {
    if (post_id) fetchSinglePost();
  }, [post_id]);

  const handleDeletePost = async (postId) => {
    try {
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
        Alert.alert("Success", "Post deleted successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      Alert.alert("Error", "Something went wrong while deleting");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <PostCard
            item={post}
            currentUsername={currentUsername}
            currentUserUuid={currentUuid}
            isVisible={true}
            onRefresh={fetchSinglePost}
          />
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
  errorText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },
});
