import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  Modal,
  ActionSheetIOS,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import * as Haptics from "expo-haptics";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { auth, db } from "../../utils/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

// --- THEME ---
const palette = {
  light: {
    background: "#F8F9FB",
    surface: "#FFFFFF",
    text: "#111827",
    textMuted: "#6B7280",
    accent: "#2563EB",
    border: "#E5E7EB",
  },
  dark: {
    background: "#0F1115",
    surface: "#1A1C20",
    text: "#F9FAFB",
    textMuted: "#9CA3AF",
    accent: "#3B82F6",
    border: "#2E3239",
  },
};

const useTheme = () => {
  const scheme = useColorScheme();
  return palette[scheme === "dark" ? "dark" : "light"];
};

// --- MAIN COMPONENT ---
export default function ReportScreen() {
  const theme = useTheme();

  const [reason, setReason] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState(null);
  const [urgency, setUrgency] = useState(5);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  // let orgApiKeys = {
  //   // "Org A": "Sp8n7jdDKIUuWJw7w0dRpGyQsENRUC7F",
  //   // "Org B": "RBa5CkUtqvWJsDa6H4vAGsRtFoihsVlC",
  //   // "Org C": "YetAnotherKey456",
  // };
  const [orgApiKeys, setOrgApiKeys] = useState({});

  // --- LOAD USER PROFILE ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoadingProfile(true);
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) setProfile(docSnap.data());
          
          const orgs = docSnap.data().orgs || [];

          setOrgApiKeys(prev => ({
            ...prev,
            ...Object.fromEntries(orgs.map(org => [org.name, org.id]))
          }));

          // console.log(orgApiKeys)

        } catch (e) {
          console.warn("Profile load error:", e);
        }
      }
      setLoadingProfile(false);
    });
    return unsubscribe;
  }, []);

  // --- FETCH DEPARTMENTS ---
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!organization) return;
      const apiKey = orgApiKeys[organization];
      try {
        const res = await fetch(
          "https://zymono.com/api/getDepartments",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey }),
          }
        );
        const data = await res.json();
        setDepartments(data.map((d) => d.name));
      } catch {
        Alert.alert("Error", "Failed to load departments");
      }
    };
    fetchDepartments();
  }, [organization]);

  // --- SCROLL ANIMATION ---
  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    Animated.timing(floatAnim, {
      toValue: y > 50 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // --- IMAGE COMPRESSION HELPER ---
  const compressImage = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      return result;
    } catch (err) {
      console.warn("Compression failed:", err);
      return null;
    }
  };

  // --- IMAGE PICKER ---
  const chooseImageSource = async () => {
    const options = ["Take Photo", "Choose from Library"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, "Cancel"],
          cancelButtonIndex: 2,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await takePhoto();
          } else if (buttonIndex === 1) {
            await pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        "Add Image",
        "Select an option",
        [
          { text: "Take Photo", onPress: takePhoto },
          { text: "Choose from Library", onPress: pickImage },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const compressed = await compressImage(asset.uri);
      if (compressed) {
        setImageUri(compressed.uri);
        setImageBase64(compressed.base64);
      }
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const compressed = await compressImage(asset.uri);
      if (compressed) {
        setImageUri(compressed.uri);
        setImageBase64(compressed.base64);
      }
    }
  };

  // --- LOCATION HANDLERS ---
  const requestCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocationData({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        source: "current",
      });
      Alert.alert("Location Set", "Current location added successfully!");
    } catch (e) {
      Alert.alert("Error", "Could not get current location.");
    }
  };

  const openMapPicker = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to choose on map."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocationData({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        source: "map",
      });
      setMapVisible(true);
    } catch (e) {
      Alert.alert("Error", "Could not get current location.");
    }
  };

  // --- SUBMIT REPORT ---
  const handleSubmit = async () => {
    if (!organization || !department) {
      return Alert.alert("Missing Info", "Select organization and department.");
    }
    if (!locationData) {
      return Alert.alert("Missing Location", "Please set a location before submitting.");
    }

    setSubmitting(true);
    try {
      const payload = {
        apiKey: orgApiKeys[organization],
        depId: department,
        reason,
        urgency,
        anonymous,
        imgURL: imageBase64 || "",
        user: anonymous ? null : (profile?.fullName || "Anonymous"),
        device: "SnapSafe",
        identifier: auth.currentUser?.uid || "SnapSafe Error",
        locationData,
        contactInfo: anonymous
          ? null
          : {
              name: profile?.fullName || "Unknown",
              email: profile?.email,
            },
      };

      const res = await fetch(
        "https://zymono.com/api/report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Submission failed");
      // await res.json();
      const reportData = await res.json();

      console.log(reportData)

      const userRef = doc(db, 'users', auth.currentUser?.uid);
      await updateDoc(userRef, { myreports: arrayUnion(`${orgApiKeys[organization]}\\${reportData.id}`) });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Report submitted successfully!");
      setReason("");
      setImageUri(null);
      setImageBase64(null);
      setOrganization(null);
      setDepartment(null);
      setUrgency(5);
      setAnonymous(false);
      setLocationData(null);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showIOSPicker = (options, onSelect) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options, "Cancel"], cancelButtonIndex: options.length },
        (idx) => {
          if (idx < options.length) onSelect(options[idx]);
        }
      );
    }
  };

  if (loadingProfile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
        <Text style={{ color: theme.textMuted, marginTop: 10 }}>
          Loading profile…
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAwareScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 180 }}
      >
        <Text style={[styles.welcome, { color: theme.textMuted }]}>
          Welcome, {profile?.fullName}
        </Text>

        {/* Organization Picker */}
        <Text style={[styles.label, { color: theme.textMuted }]}>
          Organization
        </Text>
        {Platform.OS === "ios" ? (
          <TouchableOpacity
            onPress={() =>
              showIOSPicker(Object.keys(orgApiKeys), (val) =>
                setOrganization(val)
              )
            }
            style={[
              styles.inputBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text
              style={{ color: organization ? theme.text : theme.textMuted }}
            >
              {organization || "Select organization"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.pickerBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Picker
              selectedValue={organization}
              onValueChange={(val) => setOrganization(val)}
            >
              <Picker.Item label="Select organization" value={null} />
              {Object.keys(orgApiKeys).map((org) => (
                <Picker.Item label={org} value={org} key={org} />
              ))}
            </Picker>
          </View>
        )}

        {/* Department Picker */}
        {departments.length > 0 && (
          <>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              Department
            </Text>
            {Platform.OS === "ios" ? (
              <TouchableOpacity
                onPress={() =>
                  showIOSPicker(departments, (v) => setDepartment(v))
                }
                style={[
                  styles.inputBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={{ color: department ? theme.text : theme.textMuted }}
                >
                  {department || "Select department"}
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.pickerBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Picker
                  selectedValue={department}
                  onValueChange={(v) => setDepartment(v)}
                >
                  <Picker.Item label="Select department" value={null} />
                  {departments.map((d) => (
                    <Picker.Item label={d} value={d} key={d} />
                  ))}
                </Picker>
              </View>
            )}
          </>
        )}

        {/* Urgency */}
        <Text style={[styles.label, { color: theme.textMuted }]}>Urgency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
            const selected = num === urgency;
            return (
              <TouchableOpacity
                key={num}
                onPress={() => setUrgency(num)}
                style={[
                  styles.urgencyChip,
                  {
                    backgroundColor: selected ? theme.accent : theme.surface,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? "#fff" : theme.text,
                    fontWeight: selected ? "700" : "500",
                  }}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Image Picker */}
        <TouchableOpacity
          style={[
            styles.imageBox,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
          onPress={chooseImageSource}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={{ color: theme.textMuted }}>📷 Tap to add image</Text>
          )}
        </TouchableOpacity>

        {/* Reason Input */}
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Describe the issue..."
          placeholderTextColor={theme.textMuted}
          multiline
          value={reason}
          onChangeText={setReason}
        />

        {/* Location Section */}
        <Text style={[styles.label, { color: theme.textMuted }]}>Location</Text>
        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[
              styles.locButton,
              {
                backgroundColor:
                  locationData?.source === "current"
                    ? theme.accent
                    : theme.surface,
                borderColor:
                  locationData?.source === "current"
                    ? theme.accent
                    : theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={requestCurrentLocation}
          >
            <Text
              style={{
                color:
                  locationData?.source === "current" ? "#fff" : theme.text,
                fontWeight: "600",
              }}
            >
              Use Current
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locButton,
              {
                backgroundColor:
                  locationData?.source === "map"
                    ? theme.accent
                    : theme.surface,
                borderColor:
                  locationData?.source === "map" ? theme.accent : theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={openMapPicker}
          >
            <Text
              style={{
                color: locationData?.source === "map" ? "#fff" : theme.text,
                fontWeight: "600",
              }}
            >
              Choose on Map
            </Text>
          </TouchableOpacity>
        </View>

        {locationData?.latitude && (
          <Text style={{ color: theme.textMuted, marginTop: 8 }}>
            📍 Lat: {locationData.latitude.toFixed(5)}, Lng:{" "}
            {locationData.longitude.toFixed(5)}
          </Text>
        )}

        {/* Anonymous Toggle */}
        <TouchableOpacity
          style={[
            styles.row,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
          onPress={() => setAnonymous((prev) => !prev)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: anonymous ? theme.accent : "transparent",
                borderColor: theme.border,
              },
            ]}
          />
          <Text style={{ color: theme.text, marginLeft: 10 }}>
            Send anonymously
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* Floating Submit */}
      <Animated.View
        style={[
          styles.fabWrap,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.fab, { backgroundColor: theme.accent }]}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.fabText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* MAP MODAL */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setLocationData({
                latitude,
                longitude,
                source: "map",
              });
            }}
            initialRegion={{
              latitude: locationData?.latitude ?? 37.7749,
              longitude: locationData?.longitude ?? -122.4194,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={
              locationData && {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            }
          >
            {locationData && (
              <Marker coordinate={locationData} title="Selected Location" />
            )}
          </MapView>
          <TouchableOpacity
            onPress={() => setMapVisible(false)}
            style={[styles.mapClose, { backgroundColor: theme.accent }]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  welcome: { fontWeight: "900", marginTop: 16, marginBottom: 8, fontSize: 20 },
  label: { fontWeight: "600", marginTop: 16, marginBottom: 8, fontSize: 14 },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    justifyContent: "center",
    marginBottom: 14,
  },
  pickerBox: { borderWidth: 1, borderRadius: 12, marginBottom: 14 },
  urgencyChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  imageBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 280,
    marginVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  image: { width: "100%", height: "100%", borderRadius: 12 },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    height: 120,
    textAlignVertical: "top",
    marginVertical: 10,
  },
  rowButtons: { flexDirection: "row", justifyContent: "space-between" },
  locButton: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginRight: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  fabWrap: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    borderRadius: 30,
    paddingHorizontal: 60,
    paddingVertical: 14,
    elevation: 5,
    minWidth: "80%",
    alignItems: "center",
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  mapClose: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
});
