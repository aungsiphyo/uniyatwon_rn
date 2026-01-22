import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import endpoints from "../endpoints/endpoints";

const Comments = ({ post_id, commentComplete, comments = [], likeCount }) => {
  const [commentText, setCommentText] = useState("");
  const [jwt, setJwt] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("username");
      setJwt(token);
      setCurrentUsername(user);
    };
    loadAuth();
  }, []);

  const getAvatar = (path) => {
    if (!path || path === "default.png" || path === "") {
      return "https://ui-avatars.com/api/?name=User";
    }
    return encodeURI(`${endpoints.baseURL}${path.trim()}`);
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(endpoints.comment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          "X-Username": currentUsername,
        },
        body: JSON.stringify({
          post_id: post_id,
          Description: commentText,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error: Not JSON response");
      }

      const data = await response.json();
      if (data.success) {
        setCommentText("");
        commentComplete();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      console.error("Comment Submit Error:", error);
      Alert.alert("Error", "Network request failed.");
    }
  };

  const CommentItem = ({ item }) => {
    const [liked, setLiked] = useState(false);

    return (
      <View style={styles.commentRow}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/profile",
              params: { user_uuid: item.user_uuid },
            })
          }
        >
          <Image
            source={{ uri: getAvatar(item.Profile_photo) }}
            style={styles.commentAvatar}
          />
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={styles.commentHeaderRow}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/profile",
                  params: { user_uuid: item.user_uuid },
                })
              }
            >
              <Text style={styles.commentName}>{item.Username || "User"}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>
              {item.Created_at || "Just now"}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.Description}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setLiked(!liked)}
          style={styles.commentLike}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={16}
            color={liked ? "#D64545" : "#444"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 10 }}
      >
        {comments.length > 0 ? (
          comments.map((c, index) => (
            <CommentItem key={c.id || index} item={c} />
          ))
        ) : (
          <Text style={styles.noComments}>No comments yet. Be the first!</Text>
        )}
      </ScrollView>

      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSubmit}>
            <Ionicons name="send" size={24} color="#FFD84D" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Comments;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Comment Styles
  commentRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 16 },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  commentContent: { flex: 1 },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  commentName: { fontWeight: "700", fontSize: 13, marginRight: 8 },
  commentTime: { fontSize: 11, color: "#888" },
  commentText: { fontSize: 14, color: "#333" },
  commentLike: { paddingLeft: 10 },
  noComments: { textAlign: "center", color: "#999", marginTop: 20 },
  inputSection: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: "#fff",
  },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: { marginLeft: 12 },
});
