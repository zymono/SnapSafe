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
        <Ionicons name="trash-outline" size={22} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

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
  container: { flex: 1, backgroundColor: '#f5f6fa', paddingTop: 50 },
  header: { fontSize: 28, fontWeight: '700', color: '#1e1e1e', marginLeft: 20, marginBottom: 20 },
  orgCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.06)',
    elevation: 4,
  },
  orgTitle: { fontSize: 18, fontWeight: '600', color: '#222' },
  orgId: { fontSize: 12, color: '#888', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 6px 10px rgba(26, 115, 232, 0.3)',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalHeader: { fontSize: 22, fontWeight: '700', marginBottom: 25, color: '#111' },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
  },
  qrButton: { backgroundColor: '#34a853' },
  codeButton: { backgroundColor: '#fbbc05' },
  optionText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    width: '100%',
    alignItems: 'center',
  },
  cancelText: { color: '#333', fontSize: 16, fontWeight: '600' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  qrOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrSquare: {
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
  },
  qrCloseButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 30,
  },
});





