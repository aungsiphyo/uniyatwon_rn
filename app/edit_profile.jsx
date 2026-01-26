import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

const EditProfile = () => {
  const { updateSession } = useAuth();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [major, setMajor] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  /* ================= FETCH PROFILE ================= */
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(endpoints.profileMe, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      const user =
        json.user ||
        (json.posts && json.posts.length > 0 ? json.posts[0] : null);

      if (user) {
        setUsername(user.Username || "");
        setPhone(user.Phone || "");
        setYear(user.Year || "");
        setLocation(user.Location || "");
        setMajor(user.Major || "");
        if (user.Profile_photo) {
          setPhoto({ uri: endpoints.baseURL + user.Profile_photo });
        }
      }
    } catch (e) {
      console.log("Fetch Profile Error:", e);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /* ================= 🔧 FIXED IMAGE COMPRESSION ================= */
  const getFormat = (uri) => {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return ImageManipulator.SaveFormat.PNG;
    if (lower.endsWith(".webp")) return ImageManipulator.SaveFormat.WEBP;
    return ImageManipulator.SaveFormat.JPEG;
  };

  const compressImage = async (asset) => {
    try {
      const info = await FileSystem.getInfoAsync(asset.uri);

      // ✅ Skip compression if already small (<300KB)
      if (!info.size || info.size < 300 * 1024) {
        return asset;
      }

      const result = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300 } }],
        {
          compress: 0.6,
          format: getFormat(asset.uri),
        },
      );

      return {
        ...asset,
        uri: result.uri,
      };
    } catch (err) {
      console.log("Compression Error:", err);
      return asset;
    }
  };

  /* ================= PICK IMAGE ================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // 🔧 FIX: no compression here
    });

    if (!result.canceled) {
      const original = result.assets[0];
      const compressed = await compressImage(original);
      setPhoto(compressed);
    }
  };

  /* ================= SAVE PROFILE ================= */
  const saveProfile = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      if (photo && photo.uri && !photo.uri.startsWith("http")) {
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        console.log(
          "DEBUG: Final image size:",
          (fileInfo.size / 1024).toFixed(1),
          "KB",
        );
      }

      const formData = new FormData();
      formData.append("Username", username);
      formData.append("Phone", phone);
      formData.append("Year", year);
      formData.append("Location", location);

      if (photo && photo.uri && !photo.uri.startsWith("http")) {
        const ext = photo.uri.split(".").pop();
        formData.append("Profile_photo", {
          uri: photo.uri,
          name: `profile.${ext}`,
          type: `image/${ext}`,
        });
      }

      const res = await fetch(endpoints.editProfile, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        updateSession({
          Username: username,
          Profile_photo:
            json.Profile_photo ||
            (photo?.uri?.startsWith("http")
              ? photo.uri.replace(endpoints.baseURL, "")
              : null),
        });

        Alert.alert("Success", "Profile updated");
        router.back();
      } else {
        Alert.alert("Error", json.message || "Update failed");
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  /* ================= UI (UNCHANGED) ================= */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AVATAR */}
        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
          <View style={styles.avatarCircle}>
            <Image
              source={{
                uri: photo?.uri || endpoints.baseURL + "default.png",
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </View>
          <Text style={styles.changePhoto}>Change Photo</Text>
          <Text style={styles.subText}>{major || "Student"}</Text>
        </TouchableOpacity>

        {/* FORM */}
        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Year / Semester</Text>
          <TextInput style={styles.input} value={year} onChangeText={setYear} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* SAVE */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default EditProfile;

/* ================= STYLES (UNCHANGED) ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 40 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  avatarWrap: { alignItems: "center", marginVertical: 10 },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#000",
    padding: 6,
    borderRadius: 20,
  },
  changePhoto: { marginTop: 8, fontWeight: "600", color: "#007AFF" },
  subText: { color: "#999", fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: "#f9f9f9",
    margin: 16,
    borderRadius: 15,
    padding: 20,
  },
  label: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginTop: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  saveText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
