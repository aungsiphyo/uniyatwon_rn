import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router"; // 1. Import useRouter
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import endpoints from "../endpoints/endpoints";

const PostLikes = () => {
  const { post_id } = useLocalSearchParams();
  const router = useRouter(); // 2. Initialize router

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true); // 3. Track if more data exists

  const fetchLikes = async (pageNum = 1) => {
    // Stop if we already know there is no more data
    if (!hasMore && pageNum > 1) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const url = `http://api.uniyatwon.com/fetchlikeusers.php?post_id=${post_id}&page=${pageNum}`;

      console.log("Fetching from:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
        },
      });

      const json = await res.json();

      if (json.success && json.data) {
        // 4. Check if data is empty to stop the loop
        if (json.data.length === 0) {
          setHasMore(false);
        } else {
          setUsers((prev) =>
            pageNum === 1 ? json.data : [...prev, ...json.data],
          );
        }
      }
    } catch (err) {
      console.log("Fetch likes error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (post_id) fetchLikes(1);
  }, [post_id]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Image
        source={{
          uri: encodeURI(
            endpoints.baseURL + (item.Profile_photo || "default-avatar.png"),
          ),
        }}
        style={styles.avatar}
      />
      <Text style={styles.username}>{item.Username || "User"}</Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="heart-outline" size={40} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No Likes Yet</Text>
      <Text style={styles.emptySub}>
        When people like this post, they'll show up here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Likes</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item, index) => item.user_uuid + index}
        renderItem={renderItem}
        onRefresh={() => {
          setRefreshing(true);
          setHasMore(true);
          setPage(1);
          fetchLikes(1);
        }}
        refreshing={refreshing}
        onEndReached={() => {
          if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchLikes(nextPage);
          }
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={users.length === 0 ? { flex: 1 } : null}
        ListEmptyComponent={!loading ? <EmptyState /> : null}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator style={{ margin: 20 }} color="#FFD84D" />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default PostLikes;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  username: { fontSize: 16, fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});
