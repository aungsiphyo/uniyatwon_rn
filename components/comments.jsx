import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
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

const Comments = ({ post_id }) => {
  const [commentText, setCommentText] = useState("");
  const [jwt, setJwt] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // The specific comment object
  const inputRef = useRef(null);
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

  const fetchComments = async () => {
    if (!jwt || !post_id) return;
    try {
      setLoading(true);
      const response = await fetch(endpoints.fetchComments, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ post_id: post_id }),
      });
      const data = await response.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jwt) fetchComments();
  }, [jwt, post_id]);

  const getAvatar = (path) => {
    if (!path || path === "default.png" || path === "") {
      return "https://ui-avatars.com/api/?name=User";
    }
    return encodeURI(`${endpoints.baseURL}${path.trim()}`);
  };

  // Logic to handle "Reply" button click
  const onReply = (item) => {
    setReplyingTo(item);
    // If replying to a reply, add the @username automatically
    if (item.Parent_id) {
      setCommentText(`@${item.Username} `);
    } else {
      setCommentText("");
    }
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(endpoints.comment, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          post_id: post_id,
          Description: commentText,
          // If replying to a reply, use the existing Parent_id.
          // If replying to a main comment, use that comment's id.
          parent_id: replyingTo ? replyingTo.Parent_id || replyingTo.id : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCommentText("");
        setReplyingTo(null);
        fetchComments();
      }
    } catch (error) {
      Alert.alert("Error", "Check your connection");
    }
  };

  const CommentItem = ({ item, isReply = false }) => {
    return (
      <View style={[styles.commentRow, isReply && styles.replyRow]}>
        <Image
          source={{ uri: getAvatar(item.Profile_photo) }}
          style={[styles.commentAvatar, isReply && styles.replyAvatar]}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeaderRow}>
            <Text style={styles.commentName}>{item.Username}</Text>
            <Text style={styles.commentTime}>{item.Created_at}</Text>
          </View>
          <Text style={styles.commentText}>
            {/* If it's a nested reply, you could style the @username here */}
            {item.Description}
          </Text>

          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => onReply(item)}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFD84D" style={{ marginTop: 20 }} />
        ) : (
          comments
            .filter((c) => !c.Parent_id) // Get Main Comments
            .map((parent) => (
              <View key={parent.id}>
                <CommentItem item={parent} />
                {/* Render all replies for this specific main comment */}
                {comments
                  .filter((child) => child.Parent_id === parent.id)
                  .map((reply) => (
                    <CommentItem key={reply.id} item={reply} isReply={true} />
                  ))}
              </View>
            ))
        )}
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputSection}>
        {replyingTo && (
          <View style={styles.replyingToBar}>
            <Text style={styles.replyingToText}>
              Replying to{" "}
              <Text style={{ fontWeight: "bold" }}>{replyingTo.Username}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => {
                setReplyingTo(null);
                setCommentText("");
              }}
            >
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
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
  commentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  replyRow: { marginLeft: 48, marginBottom: 10 },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  replyAvatar: { width: 26, height: 26, borderRadius: 13 },
  commentContent: { flex: 1 },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  commentName: { fontWeight: "700", fontSize: 13, marginRight: 8 },
  commentTime: { fontSize: 11, color: "#888" },
  commentText: { fontSize: 14, color: "#333", lineHeight: 18 },
  replyButton: { marginTop: 4 },
  replyButtonText: { fontSize: 12, color: "#888", fontWeight: "700" },
  inputSection: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 25,
    backgroundColor: "#fff",
  },
  replyingToBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  replyingToText: { fontSize: 12, color: "#888" },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: { marginLeft: 12 },
});
