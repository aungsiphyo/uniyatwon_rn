import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import Comments from "../../components/comments";
import PostCard from "../../components/PostCard";
import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";
const { width, height } = Dimensions.get("window");

const POST_TABS = [
  { key: "normal", label: "Posts" },
  { key: "lost_found", label: "Lost & Found" },
  { key: "announcement", label: "Announcements" },
];

// const getTimeAgo = (dateString) => {
//   const now = new Date();
//   const postDate = new Date(dateString.replace(" ", "T")); // Handle SQL format
//   const diffInSeconds = Math.floor((now - postDate) / 1000);

//   if (diffInSeconds < 60) return "Just now";

//   const minutes = Math.floor(diffInSeconds / 60);
//   if (minutes < 60) return `${minutes}m ago`;

//   const hours = Math.floor(minutes / 60);
//   if (hours < 24) return `${hours}h ago`;

//   const days = Math.floor(hours / 24);
//   if (days < 7) return `${days}d ago`;

//   return postDate.toLocaleDateString(); // Fallback to date
// };

const getTimeAgo = (dateString) => {
  if (!dateString || dateString === "Just now") return "Just now";

  try {
    // 1. Format the string for ISO compatibility
    let isoString = dateString.replace(" ", "T");

    // 2. If your DB doesn't save with a 'Z', it might be UTC.
    // Adding 'Z' tells JS to treat the input as UTC time.
    if (!isoString.includes("Z") && !isoString.includes("+")) {
      isoString += "Z";
    }

    const postDate = new Date(isoString);
    const now = new Date();

    // Calculate difference in seconds
    const diffInSeconds = Math.floor(
      (now.getTime() - postDate.getTime()) / 1000,
    );

    // FIX: If the time is in the future (server/phone clock mismatch) or < 1 min
    if (diffInSeconds < 60) return "Just now";

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return postDate.toLocaleDateString();
  } catch (e) {
    console.error("Date parsing error:", e);
    return "Just now";
  }
};

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [currentUserUuid, setCurrentUserUuid] = useState(null);
  const [activeTab, setActiveTab] = useState("normal");
  const [visiblePostId, setVisiblePostId] = useState(null);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60, // must be at least 60% visible
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setVisiblePostId(viewableItems[0].item.id);
    }
  }).current;

  // ================= FETCH LOGIC (JWT & Normalization) =================
  const loadPosts = async () => {
    setLoading(true);
    // Note: Removed setPosts([]) here to prevent "flicker" during refreshes
    try {
      const savedUsername = await AsyncStorage.getItem("username");
      const savedUuid = await AsyncStorage.getItem("user_uuid");

      setCurrentUsername(savedUsername);
      setCurrentUserUuid(savedUuid);

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${endpoints.fetchposts}?type=${activeTab}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "X-Username": savedUsername || "",
          Accept: "application/json",
        },
      });

      const data = await res.json();
      const postsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.posts)
          ? data.posts
          : [];

      const fixed = postsArray.map((p) => {
        const postId = p.id || p.post_id;
        return {
          id: postId,
          post_id: postId,
          user_uuid: p.User_uuid || p.user_uuid,
          Username: p.Username || p.user_name || "Unknown",
          Profile_photo: p.Profile_photo || p.profile || "default.png",
          Description: p.Description || p.description || "",
          type: p.type || "normal",
          media: Array.isArray(p.media) ? p.media : [],
          Created_at: p.Created_at || p.created_at || "Just now",
          Updated_at: p.Updated_at || p.updated_at || "",
          like_count: parseInt(p.like_count || p.Likes || 0),
          is_liked: !!(p.is_liked == 1 || p.is_liked === true),
          is_saved: !!(p.is_saved == 1 || p.is_saved === true),
          comments: Array.isArray(p.comments) ? p.comments : [],
        };
      });

      setPosts(fixed);
    } catch (err) {
      console.error("Fetch posts error:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep the useEffect but just call the function
  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  // const renderStories = () => (
  //   <FlatList
  //     horizontal
  //     data={STORIES}
  //     keyExtractor={(i) => i.name}
  //     showsHorizontalScrollIndicator={false}
  //     contentContainerStyle={{ paddingLeft: 16, paddingVertical: 8 }}
  //     renderItem={({ item }) => (
  //       <View style={styles.storyItem}>
  //         <View style={styles.storyAvatarWrapper}>
  //           {item.add ? (
  //             <View style={styles.addCircle}>
  //               <Feather name="plus" size={16} color="#fff" />
  //             </View>
  //           ) : (
  //             <Image source={item.avatar} style={styles.storyAvatar} />
  //           )}
  //         </View>
  //         <Text style={styles.storyName}>{item.name}</Text>
  //       </View>
  //     )}
  //   />
  // );

  const renderTabs = () => (
    <View style={styles.tabs}>
      {POST_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={styles.tabText}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandIcon}>Ü</Text>
          <View>
            <Text style={styles.brandText}>Uni Yatwon</Text>
            <Text style={styles.brandSub}>University Social Platform</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather name="bell" size={20} style={{ marginRight: 16 }} />
          <Feather name="settings" size={20} />
        </View>
      </View>

      {/* ================= FEED ================= */}
      <SectionList
        sections={[{ data: posts || [] }]}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        // ListHeaderComponent={renderStories}
        renderSectionHeader={renderTabs}
        stickySectionHeadersEnabled={true}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={{ marginTop: 20 }}
            />
          ) : null
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            currentUsername={currentUsername}
            currentUserUuid={currentUserUuid}
            isVisible={item.id === visiblePostId}
            onRefresh={loadPosts}
          />
        )}
      />
    </View>
  );
}

/* ================= POST COMPONENT ================= */
export function Post({
  item,
  currentUsername,
  currentUserUuid,
  isVisible,
  onRefresh,
}) {
  const initialLikeCount =
    item.like_count ?? item.likes ?? item.Likes ?? item.Like_count ?? 0;
  const initialIsLiked =
    item.is_liked === true || item.is_liked === 1 || item.is_liked === "1";
  const initialIsSaved =
    item.is_saved === true || item.is_saved === 1 || item.is_saved === "1";

  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saved, setSaved] = useState(initialIsSaved);
  const [commentVisible, setCommentVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const scaleLike = useRef(new Animated.Value(1)).current;
  const scaleComment = useRef(new Animated.Value(1)).current;
  const scaleSave = useRef(new Animated.Value(1)).current;

  const flatListRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const feedVideoRef = useRef(null);
  const firstVideoRef = useRef(null);
  const isMounted = useRef(true);
  const [isProcessingLike, setIsProcessingLike] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const media = Array.isArray(item.media) ? item.media : [];

  // ===== FEED VIDEO PLAYBACK CONTROL =====
  useEffect(() => {
    const controlPlayback = async () => {
      if (!feedVideoRef.current || !isMounted.current) return;

      // Only control feed video if it's a single video item
      if (media.length === 1 && media[0]?.Media_type === "video") {
        try {
          if (isVisible) {
            await feedVideoRef.current.playAsync();
            if (isMounted.current) setIsPlaying(true);
          } else {
            await feedVideoRef.current.pauseAsync();
            if (isMounted.current) setIsPlaying(false);
          }
        } catch (err) {
          console.warn("Feed video control error:", err);
        }
      }
    };

    controlPlayback();
  }, [isVisible, media]);

  // ===== VIEWER VIDEO PLAYBACK CONTROL =====
  useEffect(() => {
    const controlViewerPlayback = async () => {
      if (!viewerVisible || !firstVideoRef.current || !isMounted.current)
        return;

      try {
        if (media[0]?.Media_type === "video") {
          setTimeout(async () => {
            if (firstVideoRef.current && isMounted.current) {
              await firstVideoRef.current.playAsync();
            }
          }, 200);
        }
      } catch (err) {
        console.warn("Viewer video control error:", err);
      }
    };

    controlViewerPlayback();
    return () => {
      if (firstVideoRef.current) {
        firstVideoRef.current.pauseAsync().catch(() => {});
      }
    };
  }, [viewerVisible, media]);

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

  // Inside your component:
  const router = useRouter();

  const handleViewProfile = (user_uuid) => {
    if (!user_uuid) {
      console.warn("User UUID is missing!");
      return;
    }

    // Use router.push for Expo Router
    router.push({
      pathname: "profile_other",
      params: { user_uuid: user_uuid },
    });
  };

  return (
    <View style={styles.post}>
      {/* POST HEADER */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewProfile(item.user_uuid)}
        >
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
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewProfile(item.user_uuid)}
          >
            <Text style={styles.postName}>{item.Username}</Text>
          </TouchableOpacity>

          <Text style={styles.postTime}>{getTimeAgo(item.Created_at)}</Text>
        </View>
        <Feather name="more-vertical" size={18} />
      </View>

      {/* POST DESCRIPTION */}
      <Text style={styles.postText}>{item.Description}</Text>

      {/* ================= POST MEDIA UI (Restored from First Codebase) ================= */}
      {media.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {media.length === 1 ? (
            // SINGLE MEDIA LOGIC
            (() => {
              const m = media[0];
              const url = encodeURI(
                endpoints.baseURL.replace(/\/$/, "") +
                  "/" +
                  m.Media_url.replace(/^\//, ""),
              );
              return (
                <TouchableOpacity
                  onPress={() => {
                    setActiveIndex(0);
                    setViewerVisible(true);
                  }}
                  style={{ width: "100%" }}
                >
                  {m.Media_type === "video" ? (
                    <View style={{ position: "relative" }}>
                      <Video
                        ref={feedVideoRef}
                        source={{ uri: url }}
                        style={styles.postImage}
                        resizeMode="cover"
                        isMuted
                        isLooping
                        shouldPlay={false} // Controlled by useEffect
                      />
                      {/* PLAY / PAUSE OVERLAY */}
                      <TouchableOpacity
                        style={styles.playOverlay}
                        onPress={async () => {
                          if (isPlaying) {
                            await feedVideoRef.current?.pauseAsync();
                            setIsPlaying(false);
                          } else {
                            await feedVideoRef.current?.playAsync();
                            setIsPlaying(true);
                          }
                        }}
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
                      source={{ uri: url }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })()
          ) : (
            // CAROUSEL LOGIC (Multiple Items)
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {media.map((m, i) => {
                const url = encodeURI(
                  endpoints.baseURL.replace(/\/$/, "") +
                    "/" +
                    m.Media_url.replace(/^\//, ""),
                );
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setActiveIndex(i);
                      setViewerVisible(true);
                      setTimeout(() => {
                        flatListRef.current?.scrollToIndex({
                          index: i,
                          animated: false,
                        });
                      }, 50);
                    }}
                    style={styles.carouselItem}
                  >
                    {m.Media_type === "video" ? (
                      <Video
                        // Only refs for single video feed are managed for autoplay
                        source={{ uri: url }}
                        style={styles.postImage}
                        resizeMode="cover"
                        isLooping
                        isMuted
                        shouldPlay={false}
                      />
                    ) : (
                      <Image
                        source={{ uri: url }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* POST ACTIONS */}
      <View style={styles.postActions}>
        {/* LIKE */}
        <TouchableOpacity
          disabled={isProcessingLike}
          onPress={async () => {
            if (isProcessingLike) return;
            setIsProcessingLike(true);

            const prev = liked;
            const prevCount = likeCount;
            const token = await AsyncStorage.getItem("token"); // 🔑 Get token for auth.php

            // 1️⃣ Optimistic UI: Update immediately for a fast feel
            setLiked(!prev);
            setLikeCount(prev ? prevCount - 1 : prevCount + 1);
            bounce(scaleLike);

            try {
              const res = await fetch(endpoints.likePost, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token ? `Bearer ${token}` : "", // 🔑 Required by auth.php
                },
                body: JSON.stringify({ post_id: item.id }), // 📦 Send as JSON raw body
              });

              const data = await res.json();

              if (!data?.success) {
                // ❌ Revert if server fails
                setLiked(prev);
                setLikeCount(prevCount);
              } else {
                // ✅ Optional: Sync exact count from server response
                setLikeCount(data.like_count);
              }
            } catch (error) {
              console.error("Like error:", error);
              setLiked(prev);
              setLikeCount(prevCount);
            } finally {
              setIsProcessingLike(false);
            }
          }}
        >
          <Animated.View
            style={[styles.actionRow, { transform: [{ scale: scaleLike }] }]}
          >
            {/* 2️⃣ Conditional Rendering for "Love React" fill color */}
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={18}
              color={liked ? "#D64545" : "#444"}
            />
            {likeCount > 0 && (
              <Text style={[styles.actionText, liked && { color: "#D64545" }]}>
                {likeCount}
              </Text>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* COMMENT */}
        <TouchableOpacity onPress={() => setCommentVisible(true)}>
          <Animated.View
            style={[styles.actionRow, { transform: [{ scale: scaleComment }] }]}
          >
            <FontAwesome name="comment-o" size={18} />
            <Text style={styles.actionText}>Comment</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* SAVE - Only show if the post does NOT belong to the current user */}
        {item.user_uuid !== currentUserUuid ? (
          <TouchableOpacity
            onPress={async () => {
              const prev = saved;
              setSaved(!prev);
              bounce(scaleSave);

              try {
                const fd = new FormData();
                fd.append("post_id", item.id);
                const res = await fetch(endpoints.savePost, {
                  method: "POST",
                  body: fd,
                  credentials: "include",
                  headers: { "X-Username": currentUsername || "" },
                });
                const data = await res.json();
                if (!data?.success) setSaved(prev);
              } catch {
                setSaved(prev);
              }
            }}
          >
            <Animated.View style={{ transform: [{ scale: scaleSave }] }}>
              <FontAwesome
                name={saved ? "bookmark" : "bookmark-o"}
                size={18}
                color={saved ? PRIMARY : "#444"}
              />
            </Animated.View>
          </TouchableOpacity>
        ) : (
          <Text></Text>
        )}
      </View>

      {/* COMMENT MODAL */}
      <Modal visible={commentVisible} animationType="slide">
        <View style={styles.commentBox}>
          {/* 1. LIKED BY BAR (Top-most) */}
          {likeCount > 0 && (
            <TouchableOpacity
              style={styles.likesSummary}
              onPress={() => {
                setCommentVisible(false);
                router.push({
                  pathname: "/PostLikes",
                  params: { post_id: item.id },
                });
              }}
            >
              <View style={styles.likeIconCircle}>
                <Ionicons name="heart" size={12} color="#fff" />
              </View>
              <Text style={styles.likesText}>
                Liked by <Text style={{ fontWeight: "700" }}>{likeCount}</Text>{" "}
                {likeCount === 1 ? "person" : "people"}
              </Text>
              <Feather name="chevron-right" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          )}

          {/* 2. COMMENTS HEADER (Comments Left, Close Right) */}
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentVisible(false)}>
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>

          {/* 3. COMMENTS LIST */}
          <Comments
            post_id={item.id}
            comments={item.comments || []}
            commentComplete={onRefresh}
            likeCount={likeCount}
          />
        </View>
      </Modal>

      {/* MEDIA SWIPE MODAL */}
      <Modal visible={viewerVisible} animationType="fade" transparent={true}>
        <View style={viewerStyles.modalBackground}>
          <FlatList
            ref={flatListRef}
            data={media}
            horizontal
            pagingEnabled
            keyExtractor={(_, index) => String(index)}
            initialScrollIndex={activeIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(ev) => {
              const index = Math.round(ev.nativeEvent.contentOffset.x / width);
              setActiveIndex(index);

              // Handle Modal Video Playback on Swipe
              if (index !== 0) {
                firstVideoRef.current?.pauseAsync();
              } else if (media[0]?.Media_type === "video") {
                firstVideoRef.current?.playAsync();
              }
            }}
            renderItem={({ item: m, index }) => {
              const url = encodeURI(
                endpoints.baseURL.replace(/\/$/, "") +
                  "/" +
                  m.Media_url.replace(/^\//, ""),
              );

              const isFirstVideo = index === 0 && m.Media_type === "video";

              return (
                <View
                  style={{
                    width,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {m.Media_type === "video" ? (
                    <Video
                      ref={isFirstVideo ? firstVideoRef : null}
                      source={{ uri: url }}
                      style={{
                        width: width * 0.9,
                        height: height * 0.6,
                        borderRadius: 12,
                      }}
                      resizeMode="contain"
                      useNativeControls
                      shouldPlay={isFirstVideo}
                    />
                  ) : (
                    <Image
                      source={{ uri: url }}
                      style={{
                        width: width * 0.9,
                        height: height * 0.6,
                        borderRadius: 12,
                      }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              );
            }}
          />

          <TouchableOpacity
            style={viewerStyles.closeButton}
            onPress={() => {
              firstVideoRef.current?.pauseAsync();
              setViewerVisible(false);
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* ================= DATA ================= */
const STORIES = [
  { name: "You", add: true },
  { name: "Htet", avatar: require("../../assets/images/3.jpg") },
  { name: "Aung", avatar: require("../../assets/images/4.jpg") },
  { name: "Nay", avatar: require("../../assets/images/5.jpg") },
  { name: "Si", avatar: require("../../assets/images/6.png") },
];

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandIcon: { fontSize: 34, color: PRIMARY, marginRight: 8 },
  brandText: { fontWeight: "700", fontSize: 16 },
  brandSub: { fontSize: 11, color: "#888" },

  tabs: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 6,
    backgroundColor: "#fff",
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  activeTab: { backgroundColor: PRIMARY },
  tabText: { fontSize: 13, fontWeight: "600" },

  storyItem: { alignItems: "center", marginRight: 14 },
  storyAvatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  storyAvatar: { width: 46, height: 46, borderRadius: 23 },
  addCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  storyName: { marginTop: 6, fontSize: 12 },

  post: { paddingHorizontal: 16, marginBottom: 24 },
  postHeader: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postName: { fontWeight: "600" },
  postTime: { fontSize: 11, color: "#888" },
  postText: { marginTop: 10 },

  // Restored Previous UI Media Styles
  carouselItem: {
    width: width * 0.65,
    marginRight: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  postImage: {
    height: 200,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },

  // Play overlay for the single video
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  commentTitle: { fontSize: 16, fontWeight: "700" },

  commentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  replyRow: {
    marginLeft: 50,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  commentName: {
    fontWeight: "600",
    fontSize: 14,
    marginRight: 6,
  },
  commentTime: {
    fontSize: 12,
    color: "#888",
  },
  commentText: {
    fontSize: 14,
    color: "#000",
    marginBottom: 4,
  },
  replyText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  commentLike: {
    paddingLeft: 10,
    paddingTop: 5,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 15,
  },
  commentBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  closeModalButton: {
    padding: 4,
  },

  commentBox: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between", // Pushes title to left, close to right
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "left", // Ensures text aligns to the start
  },
  likesSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40, // Increased to clear device notch area if necessary
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  likeIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#D64545",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(214, 69, 69, 0.2)",
  },
  likesText: {
    flex: 1,
    fontSize: 16,
    color: "#444",
  },
});

const viewerStyles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
  },
});
