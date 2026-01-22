import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import endpoints from "../endpoints/endpoints";

const { width } = Dimensions.get("window");

const Post = ({ item, currentUsername }) => {
  const [liked, setLiked] = useState(item.is_liked);
  const [likeCount, setLikeCount] = useState(item.like_count);
  const scaleLike = useRef(new Animated.Value(1)).current;

  /* ===================== HELPER: URL FORMATTER ===================== */
  const getFullUrl = (path) => {
    if (!path || path === "default.png") {
      // Return a default placeholder or null if path is missing
      return "https://via.placeholder.com/150";
    }

    const base = endpoints.baseURL.endsWith("/")
      ? endpoints.baseURL.slice(0, -1)
      : endpoints.baseURL;

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return encodeURI(`${base}${cleanPath}`);
  };

  /* ===================== LOGIC: HANDLE LIKE ===================== */
  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic UI update
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    // Heart Animation
    Animated.sequence([
      Animated.timing(scaleLike, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleLike, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(endpoints.likePost, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id: item.id }),
      });

      if (!response.ok) throw new Error("Like failed");
    } catch (error) {
      // Rollback on error
      setLiked(prevLiked);
      setLikeCount(prevCount);
      console.error("Like Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* User Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: getFullUrl(item.Profile_photo) }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.username}>{item.Username || "User"}</Text>
          <Text style={styles.time}>{item.Created_at}</Text>
        </View>
      </View>

      {/* Description */}
      {item.Description ? (
        <Text style={styles.description}>{item.Description}</Text>
      ) : null}

      {/* Media / Post Image */}
      {item.media && item.media.length > 0 && item.media[0]?.Media_url ? (
        <Image
          source={{ uri: getFullUrl(item.media[0].Media_url) }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Interaction Bar */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.8}
          style={styles.actionButton}
        >
          <Animated.View
            style={{
              transform: [{ scale: scaleLike }],
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={22}
              color={liked ? "#D64545" : "#444"}
            />
            <Text style={[styles.actionCount, liked && { color: "#D64545" }]}>
              {likeCount}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
  },
  headerText: {
    marginLeft: 12,
  },
  username: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1a1a1a",
  },
  time: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    color: "#333",
    lineHeight: 21,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: width * 0.8, // Responsively square-ish
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
  },
  actions: {
    marginTop: 15,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 5,
    paddingRight: 20,
  },
  actionCount: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
    color: "#444",
  },
});

export default Post;
