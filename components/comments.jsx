import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import endpoints from "../endpoints/endpoints";
import { getTimeAgo } from "../utils/time";

const Comments = ({ post_id, like_count: likeCount = 0, onNavigate }) => {
  const [commentText, setCommentText] = useState("");
  const [jwt, setJwt] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [comments, setComments] = useState([]);
  const [likesSummary, setLikesSummary] = useState([]);
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

  const fetchLikesSummary = async () => {
    if (!jwt || !post_id) return;
    try {
      const res = await fetch(endpoints.fetchLikeUsers, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ post_id: post_id }),
      });
      const data = await res.json();
      if (data.success) {
        setLikesSummary(data.data || data.users || []);
        // If the backend returns total count separately, use that.
        // For now, we assume users array length if small, but ideally we want total count.
        // We'll rely on props passed from PostCard for total count if available,
        // but fetching here gives us the names.
      }
    } catch (error) {
      console.error("Fetch Likes Error:", error);
    }
  };

  useEffect(() => {
    if (jwt) {
      fetchComments();
      fetchLikesSummary();
    }
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
    // Remove @ sign as requested, just add the name
    setCommentText(`${item.Username} `);
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
    // Helper to render text with clickable full names, hiding @ if present
    const renderDescription = (text) => {
      if (!text) return null;

      // Get all unique usernames to match against
      const allNames = Array.from(new Set(comments.map((c) => c.Username)))
        .filter((name) => !!name)
        .sort((a, b) => b.length - a.length);

      let remainingText = text;
      const elements = [];
      let key = 0;

      // Check if text starts with "@Name" or just "Name"
      let foundName = null;
      let charsToRemove = 0;

      for (const name of allNames) {
        if (remainingText.startsWith("@" + name)) {
          foundName = name;
          charsToRemove = name.length + 1; // name + '@'
          break;
        } else if (remainingText.startsWith(name)) {
          foundName = name;
          charsToRemove = name.length;
          break;
        }
      }

      if (foundName) {
        elements.push(
          <Text
            key={key++}
            style={styles.mentionText}
            onPress={() => goToMentionProfile(foundName)}
          >
            {foundName}
          </Text>,
        );
        remainingText = remainingText.substring(charsToRemove);
      }

      elements.push(<Text key={key++}>{remainingText}</Text>);
      return elements;
    };

    const goToMentionProfile = (name) => {
      const cleanName = name.replace("@", "").trim();
      // Match by username (case-insensitive for better UX)
      const match = comments.find(
        (c) => c.Username?.toLowerCase() === cleanName.toLowerCase(),
      );
      if (match && match.user_uuid) {
        if (onNavigate) {
          onNavigate("/profile_other", { user_uuid: match.user_uuid });
        } else {
          router.push({
            pathname: "/profile_other",
            params: { user_uuid: match.user_uuid },
          });
        }
      }
    };

    const goToProfile = () => {
      if (item.user_uuid) {
        router.push({
          pathname: "/profile_other",
          params: { user_uuid: item.user_uuid },
        });
      }
    };

    return (
      <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <TouchableOpacity onPress={goToProfile} activeOpacity={0.8}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: getAvatar(item.Profile_photo) }}
              style={[styles.commentAvatar, isReply && styles.replyAvatar]}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.commentBody}>
          <View style={[styles.bubble, isReply && styles.replyBubble]}>
            <TouchableOpacity onPress={goToProfile}>
              <Text style={styles.commentName}>{item.Username}</Text>
            </TouchableOpacity>
            <Text style={styles.commentText}>
              {renderDescription(item.Description)}
            </Text>
          </View>

          <View style={styles.commentFooter}>
            <Text style={styles.commentTime}>
              {getTimeAgo(item.Created_at)}
            </Text>
            <View style={styles.dotSeparator} />
            <TouchableOpacity onPress={() => onReply(item)}>
              <Text style={styles.replyActionText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Likes Summary Header */}
      {(likesSummary.length > 0 || likeCount > 0) && (
        <TouchableOpacity
          style={styles.likesHeader}
          onPress={() => {
            if (onNavigate) {
              onNavigate("/post_likes", { post_id });
            } else {
              router.push({ pathname: "/post_likes", params: { post_id } });
            }
          }}
        >
          <View style={styles.likeIconBg}>
            <Ionicons name="heart" size={14} color="#fff" />
          </View>
          <Text style={styles.likesText}>
            {likesSummary.length > 0 ? (
              <>
                <Text style={{ fontWeight: "700" }}>
                  {likesSummary[0].Username}
                </Text>
                {(likesSummary.length > 1 || likeCount > 1) && (
                  <Text>
                    {" "}
                    and {Math.max(likesSummary.length - 1, likeCount - 1)}{" "}
                    others
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ fontWeight: "700" }}>
                {likeCount} people liked this
              </Text>
            )}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#666"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
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
            <Ionicons name="arrow-up" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Comments;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  likesHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  likeIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderRadius: 10,
    backgroundColor: "#FF3B30", // Red for heart
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  likesText: {
    fontSize: 14,
    color: "#444",
  },
  commentContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  replyContainer: {
    marginLeft: 52,
    marginBottom: 10,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  replyAvatar: { width: 28, height: 28, borderRadius: 14 },
  commentBody: { flex: 1, paddingRight: 8 },
  bubble: {
    backgroundColor: "#F2F3F5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexShrink: 1, // Ensure it can shrink to wrap
    borderTopLeftRadius: 4,
  },
  replyBubble: {
    backgroundColor: "#F7F8FA",
  },
  commentName: {
    fontWeight: "900",
    fontSize: 14,
    color: "#050505",
    marginBottom: 4,
    includeFontPadding: false,
  },
  commentText: {
    fontSize: 15,
    color: "#1C1E21",
    lineHeight: 28,
    includeFontPadding: false,
  },
  mentionText: {
    color: "#0064E0", // Classic blue for mentions
    fontWeight: "700",
  },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 12,
  },
  commentTime: { fontSize: 12, color: "#65676B" },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#65676B",
    marginHorizontal: 8,
  },
  replyAction: {},
  replyActionText: {
    fontSize: 13,
    color: "#1C1E21",
    fontWeight: "800",
    // textTransform: "uppercase",
  },
  inputSection: {
    borderTopWidth: 1,
    borderTopColor: "#E4E6EB",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 35 : 20,
    backgroundColor: "#fff",
    flexDirection: "column",
  },
  replyingToBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#FFD84D20", // Light version of primary
    padding: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD84D",
  },
  replyingToText: { fontSize: 13, color: "#444" },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: 16,
    color: "#1C1E21",
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: "#FFD84D",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD84D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
});
