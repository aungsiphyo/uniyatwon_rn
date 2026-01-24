import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";

export default function Upload() {
  const { userSession } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== PICK MEDIA =====
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ❌ Changed from .All to .Images
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia((prev) => [...prev, ...result.assets]);
    }
  };

  // ===== REMOVE MEDIA =====
  const removeMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== HANDLE POST =====
  const handlePost = async () => {
    if (!userSession) return Alert.alert("Error", "Not logged in");
    if (!description && media.length === 0)
      return Alert.alert("Error", "Write something or add media");

    const formData = new FormData();
    formData.append("Description", description);
    formData.append("Username", userSession.Username);
    formData.append("user_uuid", userSession.user_uuid);

    media.forEach((file, i) => {
      const ext = file.uri.split(".").pop();
      formData.append("media[]", {
        uri: file.uri,
        name: `upload_${Date.now()}_${i}.${ext}`,
        type: `image/${ext}`,
        // type: file.type === "video" ? "video/mp4" : `image/${ext}`, // ❌ Temporarily disabled video
      });
    });

    try {
      setLoading(true);
      const res = await fetch(endpoints.addpost, {
        method: "POST",
        body: formData,
        headers: {
          "X-Username": userSession.Username,
        },
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Server returned non-JSON:", responseText);
        throw new Error("Invalid server response");
      }

      if (data.success) {
        Alert.alert("Success", "Post uploaded successfully! <3");
        setDescription("");
        setMedia([]);
        router.push("/(tabs)/feed");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert(
        "Error",
        err.message || "Upload failed. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info */}
        <View style={styles.userRow}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150" }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>
              {userSession?.Username || "User"}
            </Text>
            <Text style={styles.privacy}>Public</Text>
          </View>
        </View>

        {/* Input */}
        <TextInput
          placeholder="What's on your mind...?"
          multiline
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          placeholderTextColor="#999"
        />

        {/* Preview Container */}
        {media.length > 0 && (
          <ScrollView
            horizontal
            style={styles.previewScroll}
            showsHorizontalScrollIndicator={false}
          >
            {media.map((file, index) => (
              <View key={index} style={styles.previewWrapper}>
                <Image source={{ uri: file.uri }} style={styles.preview} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeMedia(index)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={pickMedia} style={styles.mediaBtn}>
          <FontAwesome name="image" size={24} color="#45BD62" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePost}
          style={[styles.postBtn, { opacity: loading ? 0.6 : 1 }]}
          disabled={loading}
        >
          <Text style={styles.postText}>{loading ? "Posting..." : "Post"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerAction: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1877F2",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
  },
  privacy: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  input: {
    fontSize: 18,
    textAlignVertical: "top",
    color: "#000",
    paddingTop: 0,
  },
  previewScroll: {
    marginTop: 0,
    marginBottom: 30,
  },
  previewWrapper: {
    position: "relative",
    marginRight: 12,
  },
  preview: {
    width: 200,
    height: 250,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  mediaBtn: {
    padding: 8,
  },
  postBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
