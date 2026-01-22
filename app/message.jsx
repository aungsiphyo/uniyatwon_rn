import { Ionicons } from "@expo/vector-icons";
import {
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// Mock Data
const ONLINE_USERS = [
  { id: "1", name: "You", avatar: "https://i.pravatar.cc/100?img=11", isMe: true },
  { id: "2", name: "Htet", avatar: "https://i.pravatar.cc/100?img=12" },
  { id: "3", name: "Aung", avatar: "https://i.pravatar.cc/100?img=13" },
  { id: "4", name: "Nay", avatar: "https://i.pravatar.cc/100?img=14" },
  { id: "5", name: "Si", avatar: "https://i.pravatar.cc/100?img=15" },
  { id: "6", name: "Phyo", avatar: "https://i.pravatar.cc/100?img=16" },
];

const MESSAGES = [
  {
    id: "1",
    user: "Htet Linn Htoo",
    message: "Okay",
    time: "10:30 PM",
    avatar: "https://i.pravatar.cc/100?img=12",
    isOnline: true,
    read: true,
  },
  {
    id: "2",
    user: "Nay Lin Aung",
    message: "Nice!",
    time: "9:20 PM",
    avatar: "https://i.pravatar.cc/100?img=14",
    isOnline: true,
    read: false,
  },
  {
    id: "3",
    user: "Aung Si Phyo",
    message: "Hi",
    time: "8:45 AM",
    avatar: "https://i.pravatar.cc/100?img=13",
    isOnline: true,
    read: false,
  },
  {
    id: "4",
    user: "Grunt",
    message: "Hey",
    time: "2:30 PM",
    avatar: "https://i.pravatar.cc/100?img=17",
    isOnline: true,
    read: false,
  },
];

export default function MessageScreen() {
  const renderOnlineUser = (item) => (
    <View key={item.id} style={styles.onlineUserContainer}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.avatar }} style={styles.onlineAvatar} />
        {item.isMe ? (
          <View style={styles.addStoryBadge}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        ) : (
          <View style={styles.onlineBadge} />
        )}
      </View>
      <Text style={styles.onlineUserName} numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity style={styles.messageRow}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.messageAvatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.messageUser}>{item.user}</Text>
        <Text style={styles.messageText} numberOfLines={1}>
          {item.message}
        </Text>
      </View>
      <View style={styles.messageMeta}>
        <Text style={styles.messageTime}>{item.time}</Text>
        {item.read && (
          <Ionicons name="checkmark-done" size={16} color="#666" style={{ marginTop: 4 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="messages"
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Online Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Online</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.onlineList}>
            {ONLINE_USERS.map(renderOnlineUser)}
          </ScrollView>
        </View>

        {/* Messages Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Messages</Text>
          <View style={styles.messagesList}>
            <FlatList
              data={MESSAGES}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false} // Disable nested scrolling
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 15,
    color: "#000",
  },
  onlineList: {
    paddingLeft: 20,
  },
  onlineUserContainer: {
    alignItems: "center",
    marginRight: 20,
    width: 60,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  onlineAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFD84D", // Theme yellow ring
  },
  addStoryBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFD84D",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#4CAF50", // Green for online
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  onlineUserName: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  messagesList: {
    paddingHorizontal: 0,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  messageAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#ddd",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#4CAF50",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  messageContent: {
    flex: 1,
    justifyContent: "center",
  },
  messageUser: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#888",
  },
  messageMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  messageTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
});