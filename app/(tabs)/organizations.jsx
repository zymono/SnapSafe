import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  useColorScheme,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { auth, db } from '../../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

// ---------- Theme ----------
const palette = {
  light: {
    background: '#F6F7FB',
    surface: '#FFFFFF',
    text: '#0B1220',
    textMuted: '#6B7280',
    accent: '#007AFF',
    success: '#34C759',
    error: '#FF3B30',
    border: '#E6E9EF',
    translucent: 'rgba(255,255,255,0.7)',
  },
  dark: {
    background: '#0A0B0D',
    surface: '#111214',
    text: '#F7FAFC',
    textMuted: '#9CA3AF',
    accent: '#0A84FF',
    success: '#30D158',
    error: '#FF6B6B',
    border: '#1E1F22',
    translucent: 'rgba(17,17,17,0.7)',
  },
};
const useTheme = () => {
  const scheme = useColorScheme();
  return palette[scheme === 'dark' ? 'dark' : 'light'];
};

// ---------- Component ----------
export default function Organizations() {
  const colorScheme = useColorScheme(); // ✅ fixed: moved hook to top level
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [organizations, setOrganizations] = useState([]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [successOrg, setSuccessOrg] = useState(null);

  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const windowWidth = Dimensions.get('window').width;

  // Animations
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Load profile & organizations
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setProfile(null);
        setOrganizations([]);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setOrganizations(Array.isArray(data.orgs) ? data.orgs : []);
        } else {
          setProfile(null);
          setOrganizations([]);
        }
      } catch (err) {
        console.warn('Failed to load user profile', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Helpers
  const persistOrgs = async (newOrgs) => {
    setOrganizations(newOrgs);
    try {
      if (profile && auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { orgs: newOrgs });
      }
    } catch (err) {
      console.warn('Failed to persist organizations', err);
    }
  };

  const removeOrganization = async (id) => {
    const filtered = organizations.filter((o) => o.id !== id);
    persistOrgs(filtered);
  };

  // Add by code
  const handleAddByCode = async () => {
    const code = (codeInput || '').trim();
    if (!code) {
      Alert.alert('Invalid code', 'Please enter a valid organization code.');
      return;
    }
    const newOrg = { id: code, name: `Org ${code}` };
    if (!organizations.some((o) => o.id === newOrg.id)) {
      const next = [...organizations, newOrg];
      await persistOrgs(next);
      setSuccessOrg(newOrg);
      setSuccessModalVisible(true);
    }
    setCodeInput('');
    setCodeModalVisible(false);
  };

  // QR scanned handler
  const handleBarCodeScanned = async ({ data } = {}) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    const regex = /^https:\/\/snapsafe\.zymono\.com\/add\/([a-zA-Z0-9_-]+)$/;
    const match = typeof data === 'string' && data.match ? data.match(regex) : null;

    if (!match) {
      Alert.alert('Invalid QR', 'This QR code is not recognized.');
      setQrModalVisible(false);
      setTimeout(() => (scannedRef.current = false), 500);
      return;
    }

    const orgId = match[1];
    let orgName = `Org ${orgId}`;

    try {
      const res = await axios.post('https://zymono.com/api/getOrgInfo', { apiKey: orgId });
      if (res?.data?.data?.orgName) orgName = res.data.data.orgName;
    } catch (err) {
      console.log('org lookup failed', err?.message ?? err);
    }

    const newOrg = { id: orgId, name: orgName };
    if (!organizations.some((o) => o.id === orgId)) {
      const next = [...organizations, newOrg];
      await persistOrgs(next);
      setSuccessOrg(newOrg);
      setSuccessModalVisible(true);
    }
    setQrModalVisible(false);
    setTimeout(() => (scannedRef.current = false), 800);
  };

  const renderOrganization = ({ item }) => (
    <Pressable
      style={({ pressed }) => [styles(theme).orgCard, pressed && { transform: [{ scale: 0.995 }] }]}
      android_ripple={{ color: theme.border }}
    >
      <View style={styles(theme).orgLeft}>
        <View style={styles(theme).avatar}>
          <Text style={styles(theme).avatarText}>{String(item.name || item.id).slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles(theme).orgTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles(theme).orgId}>{item.id}</Text>
        </View>
      </View>
      <Pressable onPress={() => removeOrganization(item.id)} accessibilityLabel={`Remove ${item.name}`} style={({ pressed }) => [styles(theme).trash, pressed && { opacity: 0.65 }]}>
        <Ionicons name="trash" size={20} color={theme.error} />
      </Pressable>
    </Pressable>
  );

  const statusBarStyle = colorScheme === 'dark' ? 'light-content' : 'dark-content';

  if (loading) {
    return (
      <SafeAreaView style={[styles(theme).root]}>
        <StatusBar barStyle={statusBarStyle} />
        <View style={styles(theme).loadingWrap}>
          <Animated.View
            style={[
              styles(theme).pulse,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.03] }) }],
              },
            ]}
          />
          <Text style={styles(theme).loadingText}>Loading organizations…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles(theme).root]}>
      <StatusBar barStyle={statusBarStyle} />

      {/* Header */}
      <View style={styles(theme).headerRow}>
        <View>
          <Text style={styles(theme).title}>Organizations</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={organizations}
        keyExtractor={(item) => item.id}
        renderItem={renderOrganization}
        contentContainerStyle={styles(theme).listContent}
        ListEmptyComponent={
          <View style={styles(theme).empty}>
            <Text style={styles(theme).emptyTitle}>No organizations yet</Text>
            <Text style={styles(theme).emptySubtitle}>Tap the add button to join an organization by code or QR.</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <Pressable style={styles(theme).fabWrap} onPress={() => setSheetVisible(true)} accessibilityLabel="Add organization">
        <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles(theme).fab}>
          <Ionicons name="add" size={28} color="#fff" />
        </BlurView>
      </Pressable>

      {/* Bottom Sheet */}
      <Modal visible={sheetVisible} transparent animationType="fade">
        <Pressable style={styles(theme).modalBackdrop} onPress={() => setSheetVisible(false)}>
          <View style={styles(theme).bottomSheet}>
            <Pressable style={styles(theme).sheetButton} onPress={() => { setSheetVisible(false); setCodeModalVisible(true); }}>
              <Ionicons name="key-outline" size={22} color={theme.text} />
              <Text style={styles(theme).sheetButtonText}>Enter Code</Text>
            </Pressable>
            <Pressable style={styles(theme).sheetButton} onPress={() => {
              setSheetVisible(false);
              if (!permission?.granted) requestPermission();
              setQrModalVisible(true);
            }}>
              <Ionicons name="qr-code-outline" size={22} color={theme.text} />
              <Text style={styles(theme).sheetButtonText}>Scan QR</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Enter Code Modal */}
      <Modal visible={codeModalVisible} transparent animationType="slide">
        <View style={styles(theme).modalBackdropCenter}>
          <View style={styles(theme).codeModal}>
            <Text style={styles(theme).modalTitle}>Enter Organization Code</Text>
            <TextInput
              placeholder="e.g. ABC123"
              placeholderTextColor={theme.textMuted}
              value={codeInput}
              onChangeText={setCodeInput}
              style={styles(theme).input}
              autoCapitalize="none"
            />
            <View style={styles(theme).modalButtons}>
              <Pressable onPress={() => setCodeModalVisible(false)} style={[styles(theme).button, styles(theme).cancel]}>
                <Text style={styles(theme).buttonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddByCode} style={[styles(theme).button, styles(theme).confirm]}>
                <Text style={styles(theme).buttonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles(theme).qrContainer}>
          {permission?.granted ? (
            <CameraView
              style={styles(theme).camera}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
          ) : (
            <Text style={styles(theme).qrText}>Camera permission not granted</Text>
          )}
          <Pressable onPress={() => setQrModalVisible(false)} style={styles(theme).closeQr}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles(theme).modalBackdropCenter}>
          <View style={styles(theme).successBox}>
            <Ionicons name="checkmark-circle" size={54} color={theme.success} />
            <Text style={styles(theme).successTitle}>Added Successfully!</Text>
            <Text style={styles(theme).successSubtitle}>
              You joined {successOrg?.name || 'an organization'}.
            </Text>
            <Pressable onPress={() => setSuccessModalVisible(false)} style={styles(theme).okButton}>
              <Text style={styles(theme).okText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = (theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    subtitle: { color: theme.textMuted, fontSize: 15, marginBottom: 2 },
    title: { color: theme.text, fontSize: 28, fontWeight: '700' },
    profileWrap: { justifyContent: 'center' },
    profilePill: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    profileText: { color: theme.text, marginLeft: 6, fontWeight: '600' },
    listContent: { paddingHorizontal: 20, paddingBottom: 120 },
    orgCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
    },
    orgLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
      backgroundColor: theme.accent + '33',
      borderRadius: 30,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: theme.accent, fontWeight: '700' },
    orgTitle: { color: theme.text, fontSize: 17, fontWeight: '600' },
    orgId: { color: theme.textMuted, fontSize: 13 },
    trash: { padding: 8 },
    fabWrap: { position: 'absolute', bottom: 30, right: 25 },
    fab: {
      borderRadius: 30,
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.accent,
      overflow: 'hidden',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: '#0009',
      justifyContent: 'flex-end',
    },
    bottomSheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    sheetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sheetButtonText: { color: theme.text, marginLeft: 10, fontSize: 16 },
    modalBackdropCenter: {
      flex: 1,
      backgroundColor: '#0009',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    codeModal: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
    },
    modalTitle: { color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 12 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 10,
      color: theme.text,
      fontSize: 16,
    },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
    button: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, marginLeft: 10 },
    cancel: { backgroundColor: theme.border },
    confirm: { backgroundColor: theme.accent },
    buttonText: { color: '#fff', fontWeight: '600' },
    qrContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    closeQr: { position: 'absolute', top: 50, right: 20 },
    qrText: { color: '#fff', textAlign: 'center', marginTop: 40 },
    successBox: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      width: '85%',
    },
    successTitle: { color: theme.text, fontSize: 20, fontWeight: '700', marginTop: 10 },
    successSubtitle: { color: theme.textMuted, marginTop: 6, fontSize: 15 },
    okButton: { marginTop: 16, backgroundColor: theme.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    okText: { color: '#fff', fontWeight: '600' },
    empty: { padding: 40, alignItems: 'center' },
    emptyTitle: { color: theme.text, fontSize: 20, fontWeight: '700' },
    emptySubtitle: { color: theme.textMuted, textAlign: 'center', marginTop: 8 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pulse: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.accent + '66',
    },
    loadingText: { color: theme.textMuted, marginTop: 14 },
  });
