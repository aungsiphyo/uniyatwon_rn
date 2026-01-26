import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import endpoints from "../endpoints/endpoints";
import { getTimeAgo } from "../utils/time";
import Comments from "./comments";

const { width, height } = Dimensions.get("window");
const PRIMARY = "#FFD84D";

export default function PostCard({
  item,
  currentUsername,
  currentUserUuid,
  isVisible,
  onRefresh,
  onDelete,
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
  const [modalMuted, setModalMuted] = useState(true);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LINES = 3; // Number of lines to show before trimming

  // When viewer opens or modalMuted changes, ensure modal video status is correct
  useEffect(() => {
    if (!flatListRef.current && !firstVideoRef.current) return;

    if (viewerVisible && firstVideoRef.current) {
      firstVideoRef.current
        .setStatusAsync({ shouldPlay: true, isMuted: modalMuted })
        .catch(() => {});
    } else if (!viewerVisible && firstVideoRef.current) {
      firstVideoRef.current
        .setStatusAsync({ shouldPlay: false })
        .catch(() => {});
    }
  }, [viewerVisible, modalMuted]);

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
    // 1. Optimistic Update
    const prevSaved = saved;
    setSaved(!prevSaved);
    bounce(scaleSave);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(endpoints.savePost, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id: postId }),
      });

      const data = await res.json();

      if (!data.success) {
        // 2. Revert if the server failed
        setSaved(prevSaved);
      } else {
        // 3. Sync with actual server state
        setSaved(data.action === "saved");
      }
    } catch (err) {
      console.error("Save post error:", err);
      setSaved(prevSaved); // Revert on network error
    }
  };

  console.log("Delete Icon Debug:", {
    postUserUuid: item.user_uuid,
    currentUserUuid,
    onDeleteExists: !!onDelete,
  });

  return (
    <View style={styles.post}>
      <View style={styles.postInner}>
        {/* {onDelete && item.user_uuid === currentUserUuid && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        )} */}
        {/* HEADER */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => handleViewProfile(item.user_uuid)}>
            <Image
              source={{
                uri: encodeURI(
                  endpoints.baseURL +
                    (item.Profile_photo || "default.png").trim(),
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
          {onDelete && item.user_uuid === currentUserUuid && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Delete Post",
                  "Are you sure you want to delete this post?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => onDelete(item.id),
                    },
                  ],
                );
              }}
              style={{ padding: 5 }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.postContainer}>
          {(() => {
            const desc = item.Description || "";
            const needsTruncate = desc.length > 150;
            const displayText = isExpanded ? desc : desc.slice(0, 150);
            return (
              <>
                <Text
                  style={styles.postText}
                  numberOfLines={isExpanded ? undefined : MAX_LINES}
                  ellipsizeMode="tail"
                >
                  {displayText}
                  {!isExpanded && needsTruncate && displayText.length >= 150
                    ? ""
                    : ""}
                </Text>

                {needsTruncate && (
                  <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                    <Text style={styles.seeMore}>
                      {isExpanded ? "See less" : "See more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
        </View>

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
                      source={{
                        uri: encodeURI(endpoints.baseURL + m.Media_url),
                      }}
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
          <View style={styles.like_comment}>
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
                style={[
                  styles.actionRow,
                  { transform: [{ scale: scaleLike }] },
                ]}
              >
                <FontAwesome
                  name={liked ? "heart" : "heart-o"}
                  size={18}
                  color={liked ? "#D64545" : "#444"}
                />
                <Text
                  style={[styles.actionText, liked && { color: "#D64545" }]}
                >
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
          </View>

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
              like_count={likeCount}
              onNavigate={(path, params) => {
                setCommentVisible(false);
                setTimeout(() => {
                  router.push({ pathname: path, params });
                }, 300); // Small delay to allow modal to close smoothly
              }}
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
                const index = Math.round(
                  ev.nativeEvent.contentOffset.x / width,
                );
                setActiveIndex(index);

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
                      height,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {m.Media_type === "video" ? (
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={async () => {
                          const next = !modalMuted;
                          setModalMuted(next);
                          try {
                            if (isFirstVideo && firstVideoRef.current) {
                              await firstVideoRef.current.setStatusAsync({
                                isMuted: next,
                                shouldPlay: true,
                              });
                            }
                          } catch (e) {
                            // fallback to playAsync
                            if (isFirstVideo && firstVideoRef.current) {
                              try {
                                if (!next)
                                  await firstVideoRef.current.playAsync();
                              } catch {}
                            }
                          }
                        }}
                      >
                        <Video
                          ref={isFirstVideo ? firstVideoRef : null}
                          source={{ uri: url }}
                          style={{ width: width, height: height }}
                          resizeMode="contain"
                          useNativeControls
                          shouldPlay={isFirstVideo}
                          isMuted={modalMuted}
                        />
                      </TouchableOpacity>
                    ) : (
                      <Image
                        source={{ uri: url }}
                        style={{ width: width, height: height }}
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
  seeMore: {
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 4,
    fontSize: 14,
  },
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

  postInner: {
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  like_comment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
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
  postText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  seeMore: {
    color: "#007AFF", // Blue link color
    fontWeight: "600",
    marginTop: 4,
  },
  postContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
});
