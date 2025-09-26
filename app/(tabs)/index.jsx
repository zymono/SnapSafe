import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker"; // <-- Dropdown picker
import { auth, db } from "../../utils/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const [reason, setReason] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // dropdown state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);

  // org → key mapping
  const orgApiKeys = {
    OrgA: "Sp8n7jdDKIUuWJw7w0dRpGyQsENRUC7F",
    OrgB: "RBa5CkUtqvWJsDa6H4vAGsRtFoihsVlC",
    OrgC: "YetAnotherKey456",
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // when org changes → set API key + fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!apiKey) return;

      try {
        const response = await fetch(
          "https://zymono-gj14155xk-zymono.vercel.app/api/getDepartments",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey }),
          }
        );

        if (!response.ok) throw new Error("Failed to fetch departments");

        const data = await response.json();
        setDepartments(data);
        setSelectedDept(null); // reset department
      } catch (err) {
        console.error(err);
        Alert.alert("Error", err.message);
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, [apiKey]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!apiKey || !selectedDept) {
      return Alert.alert("Missing Info", "Please select an organization and department");
    }

    try {
      const response = await fetch(
        "https://zymono-gj14155xk-zymono.vercel.app/api/report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            depId: selectedDept, // <-- include department
            user: profile.fullName, // manually set or from profile
            // email: profile.email,
            device: "",
            imgURL: imageUri || "",
            reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send report");
      }

      await response.json();
      Alert.alert("✅ Success", "Report submitted successfully!");

      setReason("");
      setImageUri(null);
      setSelectedOrg(null);
      setApiKey(null);
      setDepartments([]);
      setSelectedDept(null);
    } catch (error) {
      Alert.alert("❌ Error", error.message || "Something went wrong");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>
        {user && profile ? `Welcome, ${profile.fullName}` : "Not logged in"}
      </Text>

      <View style={styles.card}>
        {/* Organization Dropdown */}
        <Text style={styles.label}>Select Organization:</Text>
        <Picker
          selectedValue={selectedOrg}
          onValueChange={(value) => {
            setSelectedOrg(value);
            setApiKey(orgApiKeys[value] || null);
          }}
          style={styles.picker}
        >
          <Picker.Item label="-- Select Organization --" value={null} />
          {Object.keys(orgApiKeys).map((org) => (
            <Picker.Item key={org} label={org} value={org} />
          ))}
        </Picker>

        {/* Departments Dropdown */}
        {departments.length > 0 && (
          <>
            <Text style={styles.label}>Select Department:</Text>
            <Picker
              selectedValue={selectedDept}
              onValueChange={(value) => setSelectedDept(value)}
              style={styles.picker}
            >
              <Picker.Item label="-- Select Department --" value={null} />
              {departments.map((dept) => (
                <Picker.Item key={dept.id} label={dept.name} value={dept.name} />
              ))}
            </Picker>
          </>
        )}

        {/* Image Upload */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>📷 Tap to select an image</Text>
          )}
        </TouchableOpacity>

        {/* Reason Input */}
        <TextInput
          style={styles.reasonBox}
          value={reason}
          onChangeText={setReason}
          placeholder="Describe the issue in detail..."
          multiline
          placeholderTextColor="#9ca3af"
        />

        {/* Submit Button */}
        <TouchableOpacity onPress={handleSubmit} style={styles.buttonWrapper}>
          <LinearGradient
            colors={["#2563eb", "#1d4ed8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f3f4f6" },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#111827" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.08)", elevation: 4 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 8, color: "#111827" },
  picker: { marginBottom: 20, backgroundColor: "#f9fafb", borderRadius: 12 },
  imagePicker: { height: 200, borderWidth: 2, borderColor: "#d1d5db", borderStyle: "dashed", borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 20, backgroundColor: "#f9fafb" },
  imagePickerText: { color: "#6b7280", fontSize: 16 },
  imagePreview: { width: "100%", height: "100%", borderRadius: 12, resizeMode: "cover" },
  reasonBox: { minHeight: 140, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: "#f9fafb", textAlignVertical: "top", marginBottom: 20, color: "#111827" },
  buttonWrapper: { borderRadius: 12, overflow: "hidden" },
  submitButton: { paddingVertical: 16, alignItems: "center" },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
