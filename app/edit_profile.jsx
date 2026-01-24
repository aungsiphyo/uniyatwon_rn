import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
      console.log("Edit Profile - Fetched Data:", json);

      // The provided profile.php returns { isOwnProfile, posts }
      // We try to get user details from the first post if any, as it joined with the users table
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

  /* ================= PICK IMAGE ================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
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
      console.log("Debug: Token exists:", !!token);

      const formData = new FormData();
      formData.append("Username", username);
      formData.append("Phone", phone);
      formData.append("Year", year);
      formData.append("Location", location);
      // formData.append("Major", major);

      console.log("Debug: Form Data (Text):", {
        username,
        phone,
        year,
        location,
      });

      if (photo && photo.uri && !photo.uri.startsWith("http")) {
        const uriParts = photo.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        console.log("Debug: Appending Photo:", {
          uri: photo.uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });

        formData.append("Profile_photo", {
          uri: photo.uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });
      } else {
        console.log("Debug: No new photo to upload (or photo is remote)");
      }

      console.log("Debug: Sending request to:", endpoints.editProfile);

      const res = await fetch(endpoints.editProfile, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          // Note: Do NOT set Content-Type for FormData, Fetch sets it automatically with boundary
        },
        body: formData,
      });

      console.log("Debug: Response Status:", res.status);

      const responseText = await res.text();
      console.log("Debug: Raw Server Response:", responseText);

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Debug: JSON Parse Error:", parseError);
        throw new Error("Invalid server response format (Not JSON)");
      }

      if (json.success) {
        // Update global session
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
      console.error("Save Profile Error:", e);
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

  /* ================= UI ================= */
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
            placeholder="Enter username"
          />

          {/* <Text style={styles.label}>Major</Text>
          <TextInput
            style={styles.input}
            value={major}
            onChangeText={setMajor}
            placeholder="Enter major (e.g. CEIT)"
          /> */}

          <Text style={styles.label}>Year / Semester</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder="Enter year"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location"
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

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  avatarWrap: {
    alignItems: "center",
    marginVertical: 10,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#000",
    padding: 6,
    borderRadius: 20,
  },
  changePhoto: {
    marginTop: 8,
    fontWeight: "600",
    color: "#007AFF",
  },
  subText: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#f9f9f9",
    margin: 16,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  saveText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});
