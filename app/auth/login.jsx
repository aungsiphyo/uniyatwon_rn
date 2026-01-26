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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password required");
      return;
    }

    try {
      const cleanEmail = email.trim();
      console.log("Attempting login to:", endpoints.login, {
        Email: cleanEmail,
      });

      const res = await fetch(endpoints.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: cleanEmail, Password: password }),
      });

      console.log("Response Status:", res.status);
      const responseText = await res.text();
      console.log("Raw Response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        Alert.alert(
          "Server Error",
          "The server returned an invalid response. Check console logs.",
        );
        return;
      }

      if (!data.success) {
        Alert.alert("Login failed", data.message || "Invalid credentials");
        return;
      }

      // ✅ Update global auth context (this also handles AsyncStorage)
      await signIn(
        data.user_uuid,
        data.Username,
        data.token,
        Number(data.is_admin),
      );

      Alert.alert("Success", "Login successful");
    } catch (error) {
      console.error("Network/Login Error:", error);
      Alert.alert("Error", "Cannot connect to server. Check your connection.");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🌿 Card */}
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Welcome back to the Community</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>

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
    </View>
  );
}

const PRIMARY = "#FFD84D";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "88%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 26,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "#777", marginBottom: 24 },
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
  linkButton: {
    marginTop: 18,
    alignItems: "center",
  },
  linkText: { fontSize: 14, color: "#777" },
  linkHighlight: { color: PRIMARY, fontWeight: "700" },
});
