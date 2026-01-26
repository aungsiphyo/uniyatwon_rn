import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function Create() {
  const { userSession } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState("normal");
  // "normal" | "lost_found" | "announcement"

  // 🛡️ Safety Check: If user is not admin, prevent announcement type
  useEffect(() => {
    if (postType === "announcement" && userSession?.is_admin !== 1) {
      setPostType("normal");
    }
  }, [userSession, postType]);

  const compressImage = async (asset) => {
    // only compress images
    if (asset.type !== "image") return asset;

    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1080 } }], // social app standard
      {
        compress: 0.6, // 🔥 best balance
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return {
      ...asset,
      uri: result.uri,
      type: "image",
    };
  };

  // ===== PICK MEDIA =====
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // ✅ Changed to .All
      allowsMultipleSelection: true,
      quality: 0.7, // initial compression
      // videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled) {
      const processed = await Promise.all(
        result.assets.map((asset) => compressImage(asset)),
      );

      setMedia((prev) => [...prev, ...processed]);
    }
  };

  // ===== REMOVE MEDIA =====
  const removeMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== HANDLE POST =====
  const handlePost = async () => {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      Alert.alert("Error", "Session expired. Please login again.");
      return;
    }

    if (!userSession) return Alert.alert("Error", "Not logged in");
    if (!description && media.length === 0)
      return Alert.alert("Error", "Write something or add media");

    const formData = new FormData();
    formData.append("Description", description);
    formData.append("type", postType);
    formData.append("user_uuid", userSession.user_uuid);
    formData.append("Username", userSession.Username);

    media.forEach((file, i) => {
      let ext = file.uri.split(".").pop().toLowerCase();
      if (ext === "jpg") ext = "jpeg";

      formData.append("media[]", {
        uri: file.uri,
        name: `upload_${Date.now()}_${i}.${ext}`,
        // type: `image/${ext}`,
        type: file.type === "video" ? "video/mp4" : `image/${ext}`, // ✅ Enabled video support
      });
    });

    try {
      setLoading(true);
      const res = await fetch(endpoints.addpost, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Username": userSession.Username,
        },
      });

      console.log("HTTP Status:", res.status);
      const responseText = await res.text();
      console.log("Raw Server Response:", responseText);

      if (!res.ok) {
        Alert.alert(
          "Server Error",
          `Status ${res.status}: ${responseText.substring(0, 200)}`,
        );
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        Alert.alert(
          "JSON Error",
          `Status ${res.status}. Response: ${responseText.substring(0, 200)}`,
        );
        return;
      }

      if (data.success) {
        Alert.alert("Success", "Post uploaded successfully! <3", [
          {
            text: "OK",
            onPress: () => {
              setDescription("");
              setMedia([]);
              router.replace("/(tabs)/feed");
            },
          },
        ]);
      } else {
        let errMsg =
          data.message ||
          (data.missing ? `Missing field: ${data.missing}` : "Upload failed");

        // If there is extra debug info from the server, show it
        if (data.debug_ffmpeg) {
          errMsg += `\n\nDebug Info: ${JSON.stringify(data.debug_ffmpeg)}`;
        }

        Alert.alert("Post Failed", errMsg);
      }
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Connection Error", err.message || "Upload failed");
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
            source={{
              uri:
                userSession?.Profile_photo &&
                userSession.Profile_photo.startsWith("http")
                  ? userSession.Profile_photo
                  : `${endpoints.baseURL}${userSession?.Profile_photo || "default.png"}`.replace(
                      /([^:]\/)\/+/g,
                      "$1",
                    ),
            }}
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
      {/* 🏷️ Post Type Selector (Chips) */}
      <View style={styles.postTypeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.postTypeScroll}
        >
          {/* Normal */}
          <TouchableOpacity
            style={[
              styles.typeChip,
              postType === "normal" && styles.chipActive,
            ]}
            onPress={() => setPostType("normal")}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={postType === "normal" ? "#000" : "#666"}
            />
            <Text
              style={[
                styles.chipText,
                postType === "normal" && styles.chipTextActive,
              ]}
            >
              Normal
            </Text>
          </TouchableOpacity>

          {/* Lost & Found */}
          <TouchableOpacity
            style={[
              styles.typeChip,
              postType === "lost_found" && styles.chipActive,
            ]}
            onPress={() => setPostType("lost_found")}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={postType === "lost_found" ? "#000" : "#666"}
            />
            <Text
              style={[
                styles.chipText,
                postType === "lost_found" && styles.chipTextActive,
              ]}
            >
              Lost & Found
            </Text>
          </TouchableOpacity>

          {/* Announcement (ADMIN ONLY) */}
          {userSession?.is_admin === 1 && (
            <TouchableOpacity
              style={[
                styles.typeChip,
                postType === "announcement" && styles.chipActive,
              ]}
              onPress={() => setPostType("announcement")}
            >
              <Ionicons
                name="megaphone-outline"
                size={18}
                color={postType === "announcement" ? "#000" : "#666"}
              />
              <Text
                style={[
                  styles.chipText,
                  postType === "announcement" && styles.chipTextActive,
                ]}
              >
                Announcement
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Lost & Found Hint */}
      {/* {postType === "lost_found" && (
        <View style={styles.hintContainer}>
          <Text style={styles.lostHint}>🔍 This is a lost & found post</Text>
        </View>
      )} */}

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <TouchableOpacity onPress={pickMedia} style={styles.iconAction}>
            <Ionicons name="images" size={24} color="#45BD62" />
            <Text style={styles.iconLabel}>Photo/Video</Text>
          </TouchableOpacity>
        </View>

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
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  bottomLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  iconLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  postBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  postText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#000",
  },
  postTypeContainer: {
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    marginLeft: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  postTypeScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f2f5",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: "#FFF4C2",
    borderColor: PRIMARY,
  },
  chipText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  chipTextActive: {
    color: "#000",
  },
  hintContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  lostHint: {
    fontSize: 13,
    color: "#C47A00",
    fontWeight: "600",
  },
});
