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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";
const { width, height } = Dimensions.get("window");

const POST_TABS = [
  { key: "normal", label: "Posts" },
  { key: "lost_found", label: "Lost & Found" },
  { key: "announcement", label: "Announcements" },
];

export default function NewFeetScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [activeTab, setActiveTab] = useState("normal");
  const [visiblePostId, setVisiblePostId] = useState(null);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setVisiblePostId(viewableItems[0].item.id);
    }
  }).current;

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const savedUsername = await AsyncStorage.getItem("username");
        setCurrentUsername(savedUsername);

        const res = await fetch(`${endpoints.fetchposts}?type=${activeTab}`, {
          credentials: "include",
          headers: {
            "X-Username": savedUsername || "",
            Accept: "application/json",
          },
        });

        const data = await res.json();

        const fixed = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              media: Array.isArray(p.media)
                ? p.media
                : Array.isArray(p.Media)
                ? p.Media
                : [],
            }))
          : [];

        setPosts(fixed);
      } catch (err) {
        console.error("Fetch error:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [activeTab]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.root}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandIcon}>Ü</Text>
          <View>
            <Text style={styles.brandText}>Uni Yatwoon</Text>
            <Text style={styles.brandSub}>University Social Platform</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather name="bell" size={20} />
          <Feather name="settings" size={20} style={{ marginLeft: 14 }} />
        </View>
      </View>

      {/* ================= STORIES ================= */}
      <FlatList
        horizontal
        data={STORIES}
        keyExtractor={(i) => i.name}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
        renderItem={({ item }) => (
          <View style={styles.storyItem}>
            <View style={styles.storyAvatarWrapper}>
              {item.add ? (
                <View style={styles.addCircle}>
                  <Feather name="plus" size={16} />
                </View>
              ) : (
                <Image source={item.avatar} style={styles.storyAvatar} />
              )}
            </View>
            <Text style={styles.storyName}>{item.name}</Text>
          </View>
        )}
      />

      {/* ================= POST TYPE TABS ================= */}
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

      {/* ================= FEED ================= */}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 140 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <Post 
            item={item} 
            currentUsername={currentUsername} 
            isVisible={item.id === visiblePostId}
          />
        )}
      />

      <BottomTab />
    </View>
  );
}

function Post({ item, currentUsername, isVisible }) {
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
  const [isPlaying, setIsPlaying] = useState(false);

  const scaleLike = useRef(new Animated.Value(1)).current;
  const scaleComment = useRef(new Animated.Value(1)).current;
  const scaleSave = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef();
  const feedVideoRef = useRef(null);
  const firstVideoRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ===== FEED VIDEO PLAYBACK CONTROL =====
  useEffect(() => {
    const controlPlayback = async () => {
      if (!feedVideoRef.current || !isMounted.current) return;

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
    };

    controlPlayback();
  }, [isVisible]);

  // ===== VIEWER VIDEO PLAYBACK CONTROL =====
  useEffect(() => {
    const controlViewerPlayback = async () => {
      if (!viewerVisible || !firstVideoRef.current || !isMounted.current) return;

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
  }, [viewerVisible]);

  const bounce = (v) => {
    Animated.sequence([
      Animated.timing(v, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const media = Array.isArray(item.media) ? item.media : [];

  return (
    <View style={styles.post}>
      {/* POST HEADER */}
      <View style={styles.postHeader}>
        <Image
          source={{ uri: encodeURI(endpoints.baseURL + (item.Profile_photo || "").trim()) }}
          style={styles.postAvatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.postName}>{item.Username}</Text>
          <Text style={styles.postTime}>{item.Created_at}</Text>
        </View>
        <Feather name="more-vertical" size={18} />
      </View>

      {/* POST DESCRIPTION */}
      <Text style={styles.postText}>{item.Description}</Text>

      {/* MEDIA THUMBNAILS */}
      {media.length > 0 && (
        <View style={styles.mediaContainer}>
          {media.map((m, i) => {
            const url = encodeURI(
              endpoints.baseURL.replace(/\/$/, "") + "/" + m.Media_url.replace(/^\//, "")
            );
            return (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveIndex(i);
                  setViewerVisible(true);
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index: i, animated: false });
                  }, 50);
                }}
                style={[styles.mediaItem, media.length === 1 && { width: "100%" }]}
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
                      shouldPlay={false}
                    />
                    <TouchableOpacity
                      style={styles.playOverlay}
                      onPress={async () => {
                        if (!feedVideoRef.current) return;
                        if (isPlaying) {
                          await feedVideoRef.current.pauseAsync();
                          setIsPlaying(false);
                        } else {
                          await feedVideoRef.current.playAsync();
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
                  <Image source={{ uri: url }} style={styles.postImage} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* POST ACTIONS */}
      <View style={styles.postActions}>
        {/* LIKE */}
        <TouchableOpacity
          onPress={async () => {
            const prev = liked;
            const prevCount = likeCount;
            setLiked(!prev);
            setLikeCount(prev ? prevCount - 1 : prevCount + 1);
            bounce(scaleLike);

            try {
              const fd = new FormData();
              fd.append("post_id", item.id);
              const res = await fetch(endpoints.likePost, {
                method: "POST",
                body: fd,
                credentials: "include",
                headers: { "X-Username": currentUsername || "" },
              });
              const data = await res.json();
              if (!data?.success) {
                setLiked(prev);
                setLikeCount(prevCount);
              }
            } catch {
              setLiked(prev);
              setLikeCount(prevCount);
            }
          }}
        >
          <Animated.View style={[styles.actionRow, { transform: [{ scale: scaleLike }] }]}>
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={18}
              color={liked ? "#D64545" : "#444"}
            />
            {likeCount > 0 && <Text style={styles.actionText}>{likeCount}</Text>}
          </Animated.View>
        </TouchableOpacity>

        {/* COMMENT */}
        <TouchableOpacity onPress={() => setCommentVisible(true)}>
          <Animated.View style={[styles.actionRow, { transform: [{ scale: scaleComment }] }]}>
            <FontAwesome name="comment-o" size={18} />
            <Text style={styles.actionText}>Comment</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* SAVE */}
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
      </View>

      {/* COMMENT MODAL */}
      <Modal visible={commentVisible} animationType="slide">
        <View style={styles.commentBox}>
          <Text style={styles.commentTitle}>Comments</Text>
          <TextInput placeholder="Write a comment..." style={styles.commentInput} />
          <TouchableOpacity onPress={() => setCommentVisible(false)}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
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
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={activeIndex}
            onMomentumScrollEnd={(ev) => {
              const index = Math.round(ev.nativeEvent.contentOffset.x / width);
              setActiveIndex(index);
            }}
            renderItem={({ item: m }) => {
              const url = encodeURI(
                endpoints.baseURL.replace(/\/$/, "") + "/" + m.Media_url.replace(/^\//, "")
              );
              return (
                <View style={{ width, justifyContent: "center", alignItems: "center" }}>
                  {m.Media_type === "video" ? (
                    <Video
                      ref={firstVideoRef}
                      source={{ uri: url }}
                      style={{ width: width * 0.9, height: height * 0.6, borderRadius: 12 }}
                      resizeMode="contain"
                      shouldPlay={false}
                      useNativeControls
                    />
                  ) : (
                    <Image
                      source={{ uri: url }}
                      style={{ width: width * 0.9, height: height * 0.6, borderRadius: 12 }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              );
            }}
          />
          <TouchableOpacity
            style={viewerStyles.closeButton}
            onPress={() => setViewerVisible(false)}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* ================= BOTTOM TAB ================= */
function BottomTab() {
  return (
    <View style={styles.tabBar}>
      {["home", "search", "chatbubble-ellipses-outline", "person-outline"].map((icon, i) => (
        <Ionicons key={i} name={icon} size={22} color={i === 0 ? PRIMARY : "#444"} />
      ))}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandIcon: { fontSize: 34, color: PRIMARY, marginRight: 8 },
  brandText: { fontWeight: "700" },
  brandSub: { fontSize: 11, color: "#888" },

  tabs: { flexDirection: "row", paddingHorizontal: 16, marginVertical: 8 },
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
  postHeader: { flexDirection: "row", alignItems: "center" },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postName: { fontWeight: "600" },
  postTime: { fontSize: 11, color: "#888" },
  postText: { marginTop: 10 },

  mediaContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  mediaItem: { width: "48%", marginRight: "2%", marginBottom: 8 },
  postImage: { height: 180, borderRadius: 12, width: "100%" },

  postActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  actionRow: { flexDirection: "row", alignItems: "center" },
  actionText: { marginLeft: 6, fontSize: 14 },

  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },

  commentBox: { flex: 1, padding: 20 },
  commentTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  closeBtn: { color: PRIMARY, fontWeight: "600" },
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
