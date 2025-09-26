import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../utils/firebase';

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

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [zip, setZip] = useState('');
  const [state, setState] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const passwordRequirements = [
    { regex: /.{6,}/, label: 'At least 6 characters' },
    { regex: /[A-Z]/, label: 'One uppercase letter' },
    { regex: /[a-z]/, label: 'One lowercase letter' },
    { regex: /\d/, label: 'One number' },
    { regex: /[@$!%*?&]/, label: 'One special character' },
  ];

  const validateStep1 = () => {
    const newErrors = {};
    if (!email.match(/^\S+@\S+\.\S+$/)) newErrors.email = 'Enter a valid email';
    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/))
      newErrors.password = 'Password does not meet requirements';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (dob >= new Date()) newErrors.dob = 'Date of birth must be in the past';
    if (!zip.match(/^\d{5}$/)) newErrors.zip = 'ZIP code must be 5 digits';
    if (!state) newErrors.state = 'State is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        dob: dob.toISOString().split('T')[0],
        zip,
        state,
        email: user.email,
        createdAt: new Date(),
      });
      Alert.alert('Welcome 🎉', `Account created for ${user.email}`);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account ✨</Text>

        {step === 1 ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" style={styles.passwordIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.error}>{errors.password}</Text>}

            {/* Password Requirements */}
            <View style={styles.requirements}>
              {passwordRequirements.map((req) => (
                <Text
                  key={req.label}
                  style={{
                    color: req.regex.test(password) ? 'green' : '#999',
                    fontSize: 14,
                  }}
                >
                  {req.regex.test(password) ? '✅' : '⚪'} {req.label}
                </Text>
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next ➜</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
            />
            {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.datePickerText}>{dob.toDateString()}</Text>
              <Ionicons name="calendar" size={22} color="#666" />
            </TouchableOpacity>
            {errors.dob && <Text style={styles.error}>{errors.dob}</Text>}

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
              placeholderTextColor="#999"
              value={zip}
              onChangeText={setZip}
              keyboardType="numeric"
              maxLength={5}
            />
            {errors.zip && <Text style={styles.error}>{errors.zip}</Text>}

            <View style={styles.pickerContainer}>
              <Picker selectedValue={state} onValueChange={setState} style={styles.picker}>
                {US_STATES.map((s) => (
                  <Picker.Item key={s.value} label={s.label} value={s.value} />
                ))}
              </Picker>
            </View>
            {errors.state && <Text style={styles.error}>{errors.state}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.linkText}>← Back to Step 1</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    alignSelf: 'center',
    color: '#222',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    height: 50,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  passwordIcon: {
    marginRight: 8,
  },
  requirements: {
    marginTop: 6,
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  error: {
    color: '#D9534F',
    fontSize: 14,
    marginBottom: 8,
  },
  linkText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#007BFF',
    fontWeight: '500',
  },
});
