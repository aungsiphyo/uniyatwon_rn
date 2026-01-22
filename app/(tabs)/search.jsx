import { Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import PostCard from "../../components/PostCard";
import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";

const POST_TABS = [
  { key: "all", label: "All" },
  { key: "users", label: "Users" },
  { key: "normal", label: "Posts" },
  { key: "lost_found", label: "Lost & Found" },
  { key: "announcement", label: "Announcements" },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadUsername();
    fetchHistory();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch();
    }, 400);
    return () => clearTimeout(delay);
  }, [query, activeTab]);

  const loadUsername = async () => {
    const savedUsername = await AsyncStorage.getItem("Username");
    setCurrentUsername(savedUsername);
  };

  const fetchHistory = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem("Username");
      const res = await fetch(endpoints.searchHistory, {
        headers: { "X-Username": savedUsername || "" },
      });
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  };

  const saveSearch = async (text, targetUuid = null, targetType = "query") => {
    if (!text.trim()) return;
    try {
      const savedUsername = await AsyncStorage.getItem("Username");
      await fetch(endpoints.searchHistory, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": savedUsername || "",
        },
        body: JSON.stringify({
          search_text: text,
          target_uuid: targetUuid,
          target_type: targetType,
        }),
      });
      fetchHistory(); // Refresh
    } catch (err) {
      console.error("Save search error:", err);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const savedUsername = await AsyncStorage.getItem("Username");
      await fetch(`${endpoints.searchHistory}?id=${id}`, {
        method: "DELETE",
        headers: { "X-Username": savedUsername || "" },
      });
      fetchHistory(); // Refresh
    } catch (err) {
      console.error("Delete history error:", err);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const savedUsername = await AsyncStorage.getItem("Username");
      // Optionally save search automatically after successful search fetch
      // saveSearch(query); 

      const res = await fetch(
        `${endpoints.search}?type=${activeTab}&search=${encodeURIComponent(query)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-Username": savedUsername || "",
          },
        }
      );

      const data = await res.json();
      const fixed = Array.isArray(data)
        ? data.map((p) => ({
            ...p,
            media: Array.isArray(p.media) ? p.media : [],
          }))
        : [];

      setResults(fixed);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onResultPress = (item) => {
    // Save to history when a result is clicked
    if (item.result_type === "user") {
      saveSearch(item.Username, item.user_uuid, "user");
    } else {
      saveSearch(item.Description || "Post", item.id, "post");
    }
    // Navigate or show detail (logic to be added if needed)
  };

  const renderItem = ({ item }) => {
    // If it's a history item
    if (item.id && item.search_text && !item.Username && !item.Description) {
       return (
         <View style={styles.historyItem}>
           <TouchableOpacity 
             style={styles.historyContent}
             onPress={() => {
               setQuery(item.search_text);
               saveSearch(item.search_text);
             }}
           >
             <Feather name="clock" size={16} color="#888" style={{ marginRight: 12 }} />
             <Text style={styles.historyText}>{item.search_text}</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => deleteHistoryItem(item.id)}>
             <Feather name="x" size={16} color="#888" />
           </TouchableOpacity>
         </View>
       );
    }

    // Existing result rendering...
    if (activeTab === "users" || (activeTab === "all" && item.result_type === "user")) {
      const avatarUrl = item.Profile_photo 
        ? encodeURI(endpoints.baseURL + item.Profile_photo.trim())
        : null;

      return (
        <TouchableOpacity onPress={() => onResultPress(item)}>
          <View style={styles.userCard}>
            <View style={styles.userAvatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
              ) : (
                <View style={[styles.userAvatar, styles.userPlaceholder]}>
                  <FontAwesome name="user" size={24} color="#aaa" />
                </View>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{item.Username}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{item.Email}</Text>
            </View>

            <TouchableOpacity style={styles.userActionButton}>
              <Text style={styles.userActionText}>View</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={() => onResultPress(item)}>
        <PostCard item={item} currentUsername={currentUsername} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#666" />
          <TextInput
            placeholder="Search posts or users..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => saveSearch(query)}
            style={styles.input}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 🔘 Type Tabs */}
      {!query && (
         <View style={styles.historyHeader}>
           <Text style={styles.historyTitle}>Recent Searches</Text>
         </View>
      )}
      
      {query.length > 0 && (
        <View style={styles.tabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {POST_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, activeTab === tab.key && styles.activeTab]}
              >
                <Text style={styles.tabText}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 📄 List (Results or History) */}
      <FlatList
        data={query ? results : history}
        keyExtractor={(item, index) => String(item.id || item.user_uuid || index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={renderItem}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {query ? "No results found" : "No recent searches"}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: PRIMARY,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  userPlaceholder: {
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#050505",
  },
  userEmail: {
    fontSize: 13,
    color: "#65676b",
    marginTop: 2,
  },
  userActionButton: {
    backgroundColor: "#e4e6eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  userActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#050505",
  },
  historyHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#050505",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15, // Standard vertical padding
    backgroundColor: "#fff",
  },
  historyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  historyText: {
    fontSize: 16,
    color: "#050505",
    includeFontPadding: false, // Prevents extra padding on Android
    textAlignVertical: "center",
  },
});
