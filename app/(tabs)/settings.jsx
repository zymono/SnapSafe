import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { auth, db } from '../../utils/firebase';
import {
  signOut,
  deleteUser,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [zip, setZip] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setEmail(user.email);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFullName(data.fullName || '');
          setDob(new Date(data.dob || new Date()));
          setZip(data.zip || '');
          setState(data.state || '');
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  const handleUpdate = async () => {
    if (!fullName || !zip || !state || dob >= new Date()) {
      Alert.alert('Validation Error', 'Please fill out all fields correctly');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          fullName,
          dob: dob.toISOString().split('T')[0],
          zip,
          state,
          email,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      if (email !== user.email) {
        Alert.prompt('Re-authentication', 'Enter your current password:', async (passwordPrompt) => {
          if (!passwordPrompt) return;
          const credential = EmailAuthProvider.credential(user.email, passwordPrompt);
          await reauthenticateWithCredential(user, credential);
          await updateEmail(user, email);
        });
      }

      if (newPassword) {
        Alert.prompt('Re-authentication', 'Enter your current password:', async (passwordPrompt) => {
          if (!passwordPrompt) return;
          const credential = EmailAuthProvider.credential(user.email, passwordPrompt);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
        });
      }

      Alert.alert('Success', 'Settings updated successfully');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Update Failed', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.prompt('Confirm', 'Enter your password to delete account:', async (passwordPrompt) => {
      if (!passwordPrompt) return;
      try {
        const credential = EmailAuthProvider.credential(user.email, passwordPrompt);
        await reauthenticateWithCredential(user, credential);
        await setDoc(doc(db, 'users', user.uid), {}, { merge: true });
        await deleteUser(user);
        router.replace('/');
      } catch (error) {
        Alert.alert('Delete Failed', error.message);
      }
    });
  };

  if (loading) return <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading...</Text>;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />

        <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.datePickerText}>{dob.toDateString()}</Text>
          <Ionicons name="calendar" size={22} color="#666" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') setShowDatePicker(false);
              if (selectedDate) setDob(selectedDate);
            }}
            maximumDate={new Date()}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="ZIP Code"
          value={zip}
          onChangeText={setZip}
          keyboardType="numeric"
        />

        <View style={styles.pickerContainer}>
          <Picker selectedValue={state} onValueChange={(itemValue) => setState(itemValue)} style={styles.picker}>
            {US_STATES.map((s) => (
              <Picker.Item key={s.value} label={s.label} value={s.value} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password field with lock + eye icon */}
        <View style={styles.passwordContainer}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.passwordIcon} />
          <TextInput
            style={styles.passwordInput}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>Save Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.updateButton, { opacity: 0.9 }]} onPress={handleSignOut}>
          <Text style={styles.updateButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.updateButton, { opacity: 0.8 }]} onPress={handleDeleteAccount}>
          <Text style={styles.updateButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, marginBottom: 20, alignSelf: 'center', fontWeight: '600' },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    height: 50,
    marginBottom: 12,
  },
  passwordIcon: { marginRight: 8 },
  passwordInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  datePickerText: { fontSize: 16, color: '#333' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: { height: 50, width: '100%' },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  updateButtonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
});
