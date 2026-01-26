import { Ionicons } from "@expo/vector-icons"; // Added Ionicons
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { Dropdown } from "react-native-element-dropdown"; // New Import
import endpoints from "../../endpoints/endpoints";

const PRIMARY = "#FFD84D";

// Data for Dropdowns
const majorData = [
  { label: "Civil", value: "Civil" },
  { label: "Archi", value: "Archi" },
  { label: "ME", value: "ME" },
  { label: "CEIT", value: "CEIT" },
  { label: "EC", value: "EC" },
  { label: "EP", value: "EP" },
  { label: "MC", value: "MC" },
  { label: "Chem", value: "Chem" },
  { label: "PE", value: "PE" },
];

const yearData = [
  { label: "1st semester", value: "1st semester" },
  { label: "2nd semester", value: "2nd semester" },
  { label: "3rd semester", value: "3rd semester" },
  { label: "4th semester", value: "4th semester" },
  {
    label: "Third Year - First semester",
    value: "Third Year - First semester",
  },
  {
    label: "Third Year - Second semester",
    value: "Third Year - Second semester",
  },
  {
    label: "Fourth Year - First semester",
    value: "Fourth Year - First semester",
  },
  {
    label: "Fourth Year - Second semester",
    value: "Fourth Year - Second semester",
  },
  {
    label: "Fifth Year - First semester",
    value: "Fifth Year - First semester",
  },
  {
    label: "Fifth Year - Second semester",
    value: "Fifth Year - Second semester",
  },
  {
    label: "Sixth Year - First semester",
    value: "Sixth Year - First semester",
  },
  {
    label: "Sixth Year - Second semester",
    value: "Sixth Year - Second semester",
  },
];

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [major, setMajor] = useState(null);
  const [year, setYear] = useState(null);
  const [nrc, setNrc] = useState("");
  const [phone, setPhone] = useState("");
  const [isTeacher, setIsTeacher] = useState(false); // Added isTeacher state
  const [loading, setLoading] = useState(false);

  const submitAlert = async () => {
    // Basic validation
    if (!name || !email || !password || !major) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    // Student specific validation
    if (!isTeacher && (!year || !nrc)) {
      Alert.alert("Error", "Please fill Year of Study and Student ID");
      return;
    }

    setLoading(true);
    try {
      const finalPhone = phone.trim() === "" ? "09" : phone; // Handle optional phone

      const res = await fetch(endpoints.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: name,
          Email: email,
          Password: password,
          Major: major,
          Year: isTeacher ? "Teacher" : year, // Role based value
          Student_nrc: isTeacher ? "Teacher" : nrc, // Role based value
          Phone: finalPhone,
          role: isTeacher ? "teacher" : "student", // Added role field
        }),
      });

      const responseText = await res.text();
      const data = JSON.parse(responseText);

      if (data.success) {
        Alert.alert("Success", "Account created successfully.", [
          { text: "OK", onPress: () => router.push("/auth/login") },
        ]);
      } else {
        Alert.alert(
          "Signup failed",
          data.message || "An unknown error occurred",
        );
      }
    } catch (err) {
      Alert.alert("Error", "Check Connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo1.png")}
          style={styles.logo}
        />
      </View>

      <Text style={styles.title}>Create an Account</Text>
      <Text style={styles.subtitle}>Sign up and meet the community</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        placeholder="Your name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        placeholder="example@gmail.com"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="********"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Teacher Toggle */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setIsTeacher(!isTeacher)}
      >
        <Ionicons
          name={isTeacher ? "checkbox" : "square-outline"}
          size={24}
          color={PRIMARY}
        />
        <Text style={styles.checkboxLabel}>I'm a teacher</Text>
      </TouchableOpacity>

      {/* NEW MAJOR DROPDOWN */}
      <Text style={styles.label}>Major</Text>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        data={majorData}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder="Select Major"
        value={major}
        onChange={(item) => setMajor(item.value)}
      />

      {!isTeacher && (
        <>
          {/* NEW YEAR OF STUDY DROPDOWN */}
          <Text style={styles.label}>Year of Study</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={yearData}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select Semester"
            value={year}
            onChange={(item) => setYear(item.value)}
          />

          <Text style={styles.label}>Student ID</Text>
          <TextInput
            placeholder="3767"
            style={styles.input}
            value={nrc}
            onChangeText={setNrc}
          />
        </>
      )}

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        placeholder="9823434823"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={submitAlert}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/auth/login")}
      >
        <Text style={styles.linkText}>
          Already have an account?{" "}
          <Text style={styles.linkHighlight}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", flexGrow: 1 },
  logoContainer: { alignItems: "center", marginTop: 30, marginBottom: 20 },
  logo: { width: 240, height: 120, resizeMode: "contain" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  label: { fontSize: 13, color: "#888", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
  },
  // Style for the new Dropdown
  dropdown: {
    height: 50,
    borderColor: PRIMARY,
    borderWidth: 1.5,
    borderRadius: 30,
    paddingHorizontal: 20,
  },
  placeholderStyle: { fontSize: 14, color: "#C7C7CD" },
  selectedTextStyle: { fontSize: 14 },
  submitButton: {
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 25,
    height: 50,
    justifyContent: "center",
  },
  submitText: { fontSize: 16, fontWeight: "600" },
  linkButton: { marginTop: 20, alignItems: "center" },
  linkText: { fontSize: 14, color: "#777" },
  linkHighlight: { color: "#D4AF37", fontWeight: "700" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#444",
    marginLeft: 10,
    fontWeight: "500",
  },
});
