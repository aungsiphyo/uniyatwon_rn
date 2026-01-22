import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import endpoints from "../endpoints/endpoints";
import Comments from "./comments";

const { width, height } = Dimensions.get("window");
const PRIMARY = "#FFD84D";

// Helper for time formatting
const getTimeAgo = (dateString) => {
  if (!dateString || dateString === "Just now") return "Just now";
  try {
    let isoString = dateString.replace(" ", "T");
    if (!isoString.includes("Z") && !isoString.includes("+")) isoString += "Z";
    const postDate = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - postDate.getTime()) / 1000,
    );
    if (diffInSeconds < 60) return "Just now";
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return postDate.toLocaleDateString();
  } catch (e) {
    return "Just now";
  }
};

export default function PostCard({
  item,
  currentUsername,
  currentUserUuid,
  isVisible,
  onRefresh,
}) {
  const router = useRouter();

  // State from your original logic
  const initialLikeCount = item.like_count ?? 0;
  const initialIsLiked = !!(item.is_liked === true || item.is_liked === 1);
  const initialIsSaved = !!(item.is_saved === true || item.is_saved === 1);

  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saved, setSaved] = useState(initialIsSaved);
  const [commentVisible, setCommentVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessingLike, setIsProcessingLike] = useState(false);

  // Animated values
  const scaleLike = useRef(new Animated.Value(1)).current;
  const scaleSave = useRef(new Animated.Value(1)).current;

  // Video Refs
  const feedVideoRef = useRef(null);
  const firstVideoRef = useRef(null);
  const flatListRef = useRef();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const media = Array.isArray(item.media) ? item.media : [];

  // Autoplay Logic
  useEffect(() => {
    if (!feedVideoRef.current || !isMounted.current) return;
    if (media.length === 1 && media[0]?.Media_type === "video") {
      if (isVisible) {
        feedVideoRef.current
          .playAsync()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        feedVideoRef.current
          .pauseAsync()
          .then(() => setIsPlaying(false))
          .catch(() => {});
      }
    }
  }, [isVisible, media]);

  const bounce = (v) => {
    Animated.sequence([
      Animated.timing(v, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(v, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleViewProfile = (user_uuid) => {
    if (!user_uuid) return;
    router.push({ pathname: "profile_other", params: { user_uuid } });
  };
  const handleSavePost = async (postId) => {
    const prev = saved;
    // Optimistic UI update
    setSaved(!prev);
    bounce(scaleSave);

    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(endpoints.savePost, {
        method: "POST",
        headers: {
          // Essential for PHP to decode the body correctly
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // BODY FIX: Use JSON.stringify instead of new FormData()
        body: JSON.stringify({
          post_id: postId,
        }),
      });

      // Check if response is empty before parsing to avoid Parse Error
      const text = await res.text();
      console.log("SAVE POST RESPONSE:", text);

      if (!text) return;

      const data = JSON.parse(text);
      if (!data.success && data.message !== "Post already saved") {
        setSaved(prev); // Revert if actual server error
      }
    } catch (err) {
      console.error("Save post error:", err);
      setSaved(prev); // Revert on network failure
    }
  };

  return (
    <View style={styles.post}>
      {/* HEADER */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => handleViewProfile(item.user_uuid)}>
          <Image
            source={{
              uri: encodeURI(
                endpoints.baseURL + (item.Profile_photo || "").trim(),
              ),
            }}
            style={styles.postAvatar}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => handleViewProfile(item.user_uuid)}>
            <Text style={styles.postName}>{item.Username}</Text>
          </TouchableOpacity>
          <Text style={styles.postTime}>{getTimeAgo(item.Created_at)}</Text>
        </View>
        <Feather name="more-vertical" size={18} />
      </View>

      <Text style={styles.postText}>{item.Description}</Text>

      {/* MEDIA */}
      {media.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {media.length === 1 ? (
            <TouchableOpacity
              onPress={() => {
                setActiveIndex(0);
                setViewerVisible(true);
              }}
            >
              {media[0].Media_type === "video" ? (
                <View>
                  <Video
                    ref={feedVideoRef}
                    source={{
                      uri: encodeURI(endpoints.baseURL + media[0].Media_url),
                    }}
                    style={styles.postImage}
                    resizeMode="cover"
                    isMuted
                    isLooping
                  />
                  <TouchableOpacity
                    style={styles.playOverlay}
                    onPress={() => setIsPlaying(!isPlaying)}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={42}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <Image
                  source={{
                    uri: encodeURI(endpoints.baseURL + media[0].Media_url),
                  }}
                  style={styles.postImage}
                />
              )}
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {media.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.carouselItem}
                  onPress={() => {
                    setActiveIndex(i);
                    setViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: encodeURI(endpoints.baseURL + m.Media_url) }}
                    style={styles.postImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ACTIONS */}
      <View style={styles.postActions}>
        <TouchableOpacity
          disabled={isProcessingLike}
          onPress={async () => {
            setIsProcessingLike(true);
            const prev = liked;
            setLiked(!prev);
            setLikeCount(prev ? likeCount - 1 : likeCount + 1);
            bounce(scaleLike);
            const token = await AsyncStorage.getItem("token");
            fetch(endpoints.likePost, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ post_id: item.id }),
            })
              .then((r) => r.json())
              .catch(() => {
                setLiked(prev);
              });
            setIsProcessingLike(false);
          }}
        >
          <Animated.View
            style={[styles.actionRow, { transform: [{ scale: scaleLike }] }]}
          >
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={18}
              color={liked ? "#D64545" : "#444"}
            />
            <Text style={[styles.actionText, liked && { color: "#D64545" }]}>
              {likeCount}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCommentVisible(true)}>
          <View style={styles.actionRow}>
            <FontAwesome name="comment-o" size={18} />
            <Text style={styles.actionText}>Comment</Text>
          </View>
        </TouchableOpacity>

        {item.user_uuid !== currentUserUuid && (
          <TouchableOpacity onPress={() => handleSavePost(item.id)}>
            {/* setSaved(!saved); bounce(scaleSave); */}
            <Animated.View style={{ transform: [{ scale: scaleSave }] }}>
              <FontAwesome
                name={saved ? "bookmark" : "bookmark-o"}
                size={18}
                color={saved ? PRIMARY : "#444"}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* COMMENT MODAL */}
      <Modal visible={commentVisible} animationType="slide">
        <View style={styles.commentBox}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentVisible(false)}>
              <Ionicons name="close" size={26} />
            </TouchableOpacity>
          </View>
          <Comments
            post_id={item.id}
            comments={item.comments || []}
            commentComplete={onRefresh}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  post: { paddingHorizontal: 16, marginBottom: 24 },
  postHeader: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postName: { fontWeight: "600" },
  postTime: { fontSize: 11, color: "#888" },
  postText: { marginTop: 10 },
  postImage: {
    height: 200,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  carouselItem: {
    width: width * 0.65,
    marginRight: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionRow: { flexDirection: "row", alignItems: "center" },
  actionText: { marginLeft: 6, fontSize: 14 },
  commentBox: { flex: 1, backgroundColor: "#fff", paddingTop: 50 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  commentTitle: { fontSize: 18, fontWeight: "700" },
});
