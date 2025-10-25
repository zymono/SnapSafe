import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Easing,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../utils/firebase";
import {
  signOut,
  deleteUser,
  updateEmail,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
} from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";

const lightColors = {
  background: "#f2f2f7",
  surface: "#fff",
  textPrimary: "#111",
  textSecondary: "#666",
  tint: "#0A84FF",
  destructive: "#FF3B30",
  divider: "#e5e5ea",
};

const darkColors = {
  background: "#000",
  surface: "#1c1c1e",
  textPrimary: "#fff",
  textSecondary: "#aaa",
  tint: "#0A84FF",
  destructive: "#FF453A",
  divider: "#2c2c2e",
};

const US_STATES = [
  { label: 'Select State', value: '' },
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
];

export default function Settings() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [zip, setZip] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [user, setUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    const toValue = showDropdown ? 0 : 1;
    Animated.timing(dropdownAnim, {
      toValue,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    setShowDropdown(!showDropdown);
  };

  const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFullName(data.fullName || currentUser.displayName || "");
          setDob(data.dob ? new Date(data.dob) : new Date());
          setZip(data.zip || "");
          setState(data.state || "");
          setEmail(data.email || currentUser.email);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (!user) return;
    try {
      const needsReauth = email !== user.email || newPassword.trim();
      if (needsReauth && !currentPassword) {
        setShowPasswordModal(true);
        return;
      }
      if (needsReauth && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      const isPasswordProvider = user.providerData.some(
        (p) => p.providerId === "password"
      );

      if (email !== user.email && isPasswordProvider) {
        await updateEmail(user, email);
        await sendEmailVerification(user);
        Alert.alert(
          "Verify your email",
          "A verification link has been sent to your new email. Please verify before continuing."
        );
      } else if (email !== user.email && !isPasswordProvider) {
        Alert.alert(
          "Email change restricted",
          "This account was created using a provider (Google, Apple, etc). Please change your email through your provider account."
        );
      }

      if (newPassword.trim()) {
        await updatePassword(user, newPassword);
        setNewPassword("");
        Alert.alert("Password updated", "Your password has been successfully changed.");
      }

      if (fullName !== user.displayName) {
        await updateProfile(user, { displayName: fullName });
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName,
          dob: dob.toISOString().split("T")[0],
          zip,
          state,
          email,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setCurrentPassword("");
      setShowPasswordModal(false);
      Alert.alert("✅ Success", "Your settings have been updated.");
    } catch (err) {
      console.error("Update failed:", err);
      if (err.code === "auth/requires-recent-login") {
        Alert.alert(
          "Reauthentication Required",
          "Please log in again to update sensitive account information."
        );
      } else {
        Alert.alert("Update Failed", err.message);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      // Remove all relevant AsyncStorage keys in parallel
      try {
        await Promise.all([
          AsyncStorage.removeItem("zymonoAuth_uid"),
          AsyncStorage.removeItem("zymonoAuth_email"),
          AsyncStorage.removeItem("zymonoAuth_displayName"),
        ]);
      } catch {
        
      }
      

      // Sign out from Firebase
      try {
        await signOut(auth);
      } catch {

        
      }

      // Alert.alert("Signed Out");

      // console.log(await AsyncStorage.getItem("zymonoAuth_uid"))
    } catch (err) {
      Alert.alert("Sign Out Failed", err.message);
    }
  };


  // 🔥 Updated to also delete the Firestore document
  const handleDeleteAccount = async () => {
    Alert.alert("Delete Account", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!user) return;

            // Delete user document from Firestore first
            await deleteDoc(doc(db, "users", user.uid));

            // Then delete the user authentication account
            await deleteUser(user);

            Alert.alert("Account Deleted", "Your account has been permanently removed.");
          } catch (err) {
            if (err.code === "auth/requires-recent-login") {
              Alert.alert(
                "Reauthentication Required",
                "Please log in again before deleting your account."
              );
            } else {
              Alert.alert("Delete Failed", err.message);
            }
          }
        },
      },
    ]);
  };

  const Row = ({ label, children }) => (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={{ flex: 1, alignItems: "flex-end" }}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <Text style={[styles.Header, { color: colors.textPrimary }]}>Settings</Text>
        
        {/* Profile Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Profile</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Row label="Full Name">
            <TextInput
              style={[styles.input, { color: colors.textPrimary, textAlign: "right" }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter name"
              placeholderTextColor={colors.textSecondary}
            />
          </Row>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity onPress={() => setShowDobPicker((p) => !p)}>
            <Row label="Date of Birth">
              <Text style={{ color: colors.textSecondary }}>{dob.toDateString()}</Text>
            </Row>
          </TouchableOpacity>
          {showDobPicker && (
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={dob}
                mode="date"
                display="spinner"
                onChange={(e, d) => d && setDob(d)}
                maximumDate={new Date()}
              />
              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.tint }]}
                onPress={() => setShowDobPicker(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Row label="ZIP Code">
            <TextInput
              style={[styles.input, { color: colors.textPrimary, textAlign: "right" }]}
              value={zip}
              onChangeText={setZip}
              keyboardType="numeric"
              placeholder="12345"
              placeholderTextColor={colors.textSecondary}
            />
          </Row>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Row label="State">
            <TouchableOpacity style={styles.valueContainer} onPress={toggleDropdown}>
              <Text style={{ color: state ? colors.textPrimary : colors.textSecondary }}>
                {state ? US_STATES.find((s) => s.value === state)?.label : "Select State"}
              </Text>
              <MaterialIcons
                name={showDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </Row>
          <Animated.View
            style={[styles.dropdownList, { height: dropdownHeight, opacity: dropdownAnim }]}
          >
            {US_STATES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setState(item.value);
                  toggleDropdown();
                }}
              >
                <Text style={{ color: colors.textPrimary }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Row label="Email">
            <TextInput
              style={[styles.input, { color: colors.textPrimary, textAlign: "right" }]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholder="example@email.com"
              placeholderTextColor={colors.textSecondary}
            />
          </Row>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Row label="New Password">
            <TextInput
              style={[styles.input, { color: colors.textPrimary, textAlign: "right" }]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor={colors.textSecondary}
            />
          </Row>
        </View>

        {/* Actions Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Actions</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.row} onPress={handleUpdate}>
            <Text style={[styles.action, { color: colors.tint }]}>Update Settings</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Text style={[styles.action, { color: colors.tint }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
            <Text style={[styles.action, { color: colors.destructive }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal transparent visible={showPasswordModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Enter your current password
            </Text>
            <TextInput
              style={[styles.input, styles.modalInput, { color: colors.textPrimary }]}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current Password"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={{ color: colors.destructive }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdate}>
                <Text style={{ color: colors.tint }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  Header: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 20, fontWeight: "900" },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  section: { marginBottom: 24, borderRadius: 12, overflow: "hidden" },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 16 },
  input: { fontSize: 16, paddingVertical: 0, paddingHorizontal: 0, minWidth: 0 },
  action: { fontSize: 16, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  datePickerWrapper: { alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  doneButton: { marginTop: 8, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 },
  doneButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  dropdownList: { overflow: "hidden", marginHorizontal: 16 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "80%", borderRadius: 12, padding: 20 },
  modalInput: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginVertical: 10 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 12 },
});
