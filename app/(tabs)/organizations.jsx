import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../utils/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { colors, typography, components, spacing, borderRadius } from '../../styles/theme';

export default function Organizations() {
  const [modalVisible, setModalVisible] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  const windowWidth = Dimensions.get('window').width;

  // Fetch user profile and organizations
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(data);
          setOrganizations(data.orgs || []);
        }
      } else {
        setProfile(null);
        setOrganizations([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const removeOrganization = async (id) => {
    const filteredOrgs = organizations.filter((org) => org.id !== id);
    setOrganizations(filteredOrgs);

    if (profile && auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { orgs: filteredOrgs });
    }
  };

  const handleAddByCode = async () => {
    if (codeInput.trim() === '') {
      Alert.alert('Please enter a valid code');
      return;
    }

    const newOrg = { id: codeInput.trim(), name: `Org ${codeInput.trim()}` };
    setOrganizations((prev) => [...prev, newOrg]);
    setCodeInput('');
    setCodeModalVisible(false);

    if (profile && auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { orgs: arrayUnion(newOrg) });
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    const newOrg = { id: data, name: `Org ${data}` };
    setOrganizations((prev) => [...prev, newOrg]);

    if (profile && auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { orgs: arrayUnion(newOrg) });
    }

    Alert.alert('Organization added', `Org ID: ${data}`);
    setQrModalVisible(false);
    setScanned(false);
  };

  const renderOrganization = ({ item }) => (
    <View style={styles.orgCard}>
      <View>
        <Text style={styles.orgTitle}>{item.name}</Text>
        <Text style={styles.orgId}>ID: {item.id}</Text>
      </View>
      <TouchableOpacity onPress={() => removeOrganization(item.id)}>
        <Ionicons name="trash-outline" size={22} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Organizations</Text>

      <FlatList
        data={organizations}
        keyExtractor={(item) => item.id}
        renderItem={renderOrganization}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Main Add Options Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add Organization</Text>

            <TouchableOpacity
              style={[styles.optionButton, styles.qrButton]}
              onPress={() => {
                setModalVisible(false);
                setQrModalVisible(true);
              }}
            >
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              <Text style={styles.optionText}>Scan QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.codeButton]}
              onPress={() => {
                setModalVisible(false);
                setCodeModalVisible(true);
              }}
            >
              <Ionicons name="key-outline" size={20} color="#fff" />
              <Text style={styles.optionText}>Enter Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Enter Code Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={codeModalVisible}
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Enter Organization Code</Text>
            <TextInput
              placeholder="Enter code"
              placeholderTextColor="#999"
              style={styles.input}
              value={codeInput}
              onChangeText={setCodeInput}
            />
            <TouchableOpacity style={styles.confirmButton} onPress={handleAddByCode}>
              <Text style={styles.confirmText}>Enter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCodeModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={{ flex: 1 }}>
          {hasPermission ? (
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={{ flex: 1 }}
            >
              <View style={styles.qrOverlay}>
                <View
                  style={[
                    styles.qrSquare,
                    { width: windowWidth * 0.6, height: windowWidth * 0.6 },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={styles.qrCloseButton}
                onPress={() => setQrModalVisible(false)}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </BarCodeScanner>
          ) : (
            <View style={styles.container}>
              <Text>No access to camera</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Text style={{ color: '#1a73e8', marginTop: 20 }}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  header: {
    ...typography.h2,
    marginLeft: spacing.xl,
    marginBottom: spacing.xl,
  },
  orgCard: {
    ...components.listItem,
  },
  orgTitle: {
    ...typography.h5,
  },
  orgId: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  fab: {
    ...components.fab,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  modalOverlay: {
    ...components.modalOverlay,
  },
  modalContent: {
    ...components.modalContent,
  },
  modalHeader: {
    ...typography.h4,
    marginBottom: spacing.xxl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  qrButton: {
    backgroundColor: colors.success,
  },
  codeButton: {
    backgroundColor: colors.warning,
  },
  optionText: {
    ...typography.button,
    marginLeft: spacing.sm,
  },
  cancelButton: {
    ...components.buttonSecondary,
    marginTop: spacing.sm,
  },
  cancelText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  input: {
    ...components.input,
    marginBottom: spacing.xl,
  },
  confirmButton: {
    ...components.buttonPrimary,
    marginBottom: spacing.sm,
  },
  confirmText: {
    ...typography.button,
  },
  qrOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrSquare: {
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: borderRadius.md,
  },
  qrCloseButton: {
    position: 'absolute',
    top: 50,
    left: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.sm,
    borderRadius: 30,
  },
});





