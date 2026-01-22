import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import endpoints from "../../endpoints/endpoints";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // const handleLogin = async () => {
  //   if (!email || !password) {
  //     Alert.alert("Error", "Email and password required");
  //     return;
  //   }

  //   try {
  //     const res = await fetch(endpoints.login, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ Email: email, Password: password }),
  //     });

  //     const data = await res.json();

  //     if (!data.success) {
  //       Alert.alert("Login failed", data.message);
  //       return;
  //     }

  //     // Save login info
  //     await signIn(data.user_uuid, data.Username);
  //     Alert.alert("Success", "Login successful");

  //   } catch (e) {
  //     Alert.alert("Error", "Cannot connect to server");
  //   }
  // };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password required");
      return;
    }

    try {
      const res = await fetch(endpoints.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email,
          Password: password,
        }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!data.success) {
        Alert.alert("Login failed", data.message);
        return;
      }

      // ✅ Save JWT (React Native way)
      await AsyncStorage.setItem("token", data.token);

      // ✅ Save user info (optional but recommended)
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          username: data.Username,
          user_uuid: data.user_uuid,
        }),
      );

      // ✅ Update global auth context
      await signIn(data.user_uuid, data.Username);

      Alert.alert("Success", "Login successful");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Cannot connect to server");
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Welcome back to the Community</Text>

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      {/* Social login */}
      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialBtn}>
          <FontAwesome name="apple" size={20} />
          <Text style={styles.socialText}>Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn}>
          <Ionicons name="logo-google" size={20} />
          <Text style={styles.socialText}>Google</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Up Link */}
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/auth/signup")}
      >
        <Text style={styles.linkText}>
          Don't have an account?{" "}
          <Text style={styles.linkHighlight}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const PRIMARY = "#FFD84D";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  logoBox: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  logoText: {
    fontSize: 48,
    fontWeight: "800",
    color: PRIMARY,
    marginRight: 10,
  },
  logoTitle: { fontSize: 18, fontWeight: "700" },
  logoSub: { fontSize: 12, color: "#777" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "#777", marginBottom: 30 },
  label: { marginBottom: 6, fontWeight: "500" },
  input: {
    borderWidth: 2,
    borderColor: PRIMARY,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 18,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { fontSize: 16, fontWeight: "700" },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "48%",
    justifyContent: "center",
  },
  socialText: { marginLeft: 8, fontWeight: "600" },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#777",
  },
  linkHighlight: {
    color: PRIMARY,
    fontWeight: "700",
  },
});
