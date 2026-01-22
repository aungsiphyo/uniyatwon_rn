import { Feather, FontAwesome } from "@expo/vector-icons";
import { Video } from "expo-av";
import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import endpoints from "../endpoints/endpoints";

const { width, height } = Dimensions.get("window");
const PRIMARY = "#FFD84D";

export default function PostCard({ item, currentUsername }) {
  const initialLikeCount = item.like_count ?? item.likes ?? item.Likes ?? item.Like_count ?? 0;
  const initialIsLiked = item.is_liked === true || item.is_liked === 1 || item.is_liked === "1";
  const initialIsSaved = item.is_saved === true || item.is_saved === 1 || item.is_saved === "1";

  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saved, setSaved] = useState(initialIsSaved);
  const [commentVisible, setCommentVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const scaleLike = useRef(new Animated.Value(1)).current;
  const scaleSave = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef();

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

      {/* MEDIA */}
      {media.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {media.length === 1 ? (
            (() => {
              const m = media[0];
              const url = encodeURI(
                endpoints.baseURL.replace(/\/$/, "") + "/" + m.Media_url.replace(/^\//, "")
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
                    <Video source={{ uri: url }} style={styles.postImage} resizeMode="cover" />
                  ) : (
                    <Image source={{ uri: url }} style={styles.postImage} />
                  )}
                </TouchableOpacity>
              );
            })()
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    style={styles.carouselItem}
                  >
                    {m.Media_type === "video" ? (
                      <Video source={{ uri: url }} style={styles.postImage} resizeMode="cover" />
                    ) : (
                      <Image source={{ uri: url }} style={styles.postImage} />
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

        <TouchableOpacity onPress={() => setCommentVisible(true)}>
          <View style={styles.actionRow}>
            <FontAwesome name="comment-o" size={18} />
            <Text style={styles.actionText}>Comment</Text>
          </View>
        </TouchableOpacity>

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

      {/* MEDIA VIEWER MODAL */}
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
                      source={{ uri: url }}
                      style={{ width: width * 0.9, height: height * 0.6, borderRadius: 12 }}
                      resizeMode="contain"
                      shouldPlay
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

const styles = StyleSheet.create({
  post: { paddingHorizontal: 16, marginBottom: 24, backgroundColor: "#fff" },
  postHeader: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postName: { fontWeight: "600" },
  postTime: { fontSize: 11, color: "#888" },
  postText: { marginTop: 10 },
  carouselItem: {
    width: width * 0.65,
    marginRight: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  postImage: { height: 200, width: "100%", borderRadius: 12, backgroundColor: "#f0f0f0" },
  postActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  actionRow: { flexDirection: "row", alignItems: "center" },
  actionText: { marginLeft: 6, fontSize: 14 },
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
