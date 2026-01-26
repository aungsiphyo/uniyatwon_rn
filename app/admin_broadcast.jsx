import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import endpoints from "../endpoints/endpoints";

const PRIMARY = "#FFD84D";

export default function AdminBroadcast() {
  const { userSession } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("Announcement");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) {
      Alert.alert("Error", "Please enter a message body");
      return;
    }

    Alert.confirm = (title, message, onConfirm) => {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: "Send to Everyone", onPress: onConfirm },
      ]);
    };

    Alert.alert(
      "Confirm Broadcast",
      "This will send a notification to ALL users. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: executeBroadcast },
      ],
    );
  };

  const executeBroadcast = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(endpoints.broadcastPush, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          body,
        }),
      });

      const data = await res.json();

      if (data.success || data.id) {
        // Expo returns an object with 'id' if successful
        Alert.alert("Success", "Notifications sent successfully!");
        setBody("");
      } else {
        Alert.alert("Error", data.message || "Failed to send notifications");
      }
    } catch (err) {
      console.error("Broadcast error:", err);
      Alert.alert("Error", "Failed to communicate with broadcast server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Broadcast</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Feather name="info" size={20} color="#666" />
          <Text style={styles.infoText}>
            This message will be broadcasted to all registered mobile devices.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. New Update Available"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message Body</Text>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Type your message here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.disabledBtn]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.sendBtnText}>Broadcast Now</Text>
              <Feather
                name="send"
                size={20}
                color="#000"
                style={{ marginLeft: 8 }}
              />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { padding: 20 },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    alignItems: "center",
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  titleInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#000",
  },
  bodyInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#000",
    height: 120,
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledBtn: { opacity: 0.7 },
  sendBtnText: { fontSize: 17, fontWeight: "800", color: "#000" },
});
