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
  Modal,
  useColorScheme,
} from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../utils/firebase';
import { colors, typography, components, spacing, borderRadius } from '../../styles/theme';

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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const router = useRouter();

  const theme = {
    background: isDark ? '#000' : '#fff',
    surface: isDark ? '#1C1C1E' : colors.surface,
    textPrimary: isDark ? '#fff' : colors.textPrimary,
    textSecondary: isDark ? '#A1A1AA' : colors.textSecondary,
    border: isDark ? '#3A3A3C' : colors.gray300,
    pickerBg: isDark ? '#2C2C2E' : '#fff',
  };

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [zip, setZip] = useState('');
  const [state, setState] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

      // Send verification email
      await sendEmailVerification(user);

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        dob: dob.toISOString().split('T')[0],
        zip,
        state,
        email: user.email,
        createdAt: new Date(),
        emailVerified: false,
      });

      Alert.alert(
        'Verify Your Email 📩',
        `A verification email has been sent to ${user.email}. Please verify your email before logging in.`,
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Create Account ✨</Text>

        {step === 1 ? (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <View style={[styles.passwordContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Ionicons name="lock-closed" size={20} color={theme.textSecondary} style={styles.passwordIcon} />
              <TextInput
                style={[styles.passwordInput, { color: theme.textPrimary }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.error}>{errors.password}</Text>}

            <View style={styles.requirements}>
              {passwordRequirements.map((req) => (
                <Text
                  key={req.label}
                  style={{
                    color: req.regex.test(password) ? colors.success : theme.textSecondary,
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
              style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Full Name"
              placeholderTextColor={theme.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />
            {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

            <TouchableOpacity
              style={[styles.datePickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.datePickerText, { color: theme.textPrimary }]}>{dob.toDateString()}</Text>
              <Ionicons name="calendar" size={22} color={theme.textSecondary} />
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
                textColor={isDark ? '#fff' : '#000'}
              />
            )}

            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="ZIP Code"
              placeholderTextColor={theme.textSecondary}
              value={zip}
              onChangeText={setZip}
              keyboardType="numeric"
              maxLength={5}
            />
            {errors.zip && <Text style={styles.error}>{errors.zip}</Text>}

            {/* iOS modal picker */}
            {Platform.OS === 'ios' ? (
              <>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setShowStatePicker(true)}
                >
                  <Text style={[styles.datePickerText, { color: theme.textPrimary }]}>
                    {state ? US_STATES.find((s) => s.value === state)?.label : 'Select State'}
                  </Text>
                  <Ionicons name="chevron-down" size={22} color={theme.textSecondary} />
                </TouchableOpacity>

                <Modal animationType="slide" visible={showStatePicker} transparent>
                  <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.pickerBg }]}>
                      <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <Picker selectedValue={state} onValueChange={setState} style={styles.picker}>
                        {US_STATES.map((s) => (
                          <Picker.Item key={s.value} label={s.label} value={s.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </Modal>
              </>
            ) : (
              <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Picker selectedValue={state} onValueChange={setState} style={styles.picker}>
                  {US_STATES.map((s) => (
                    <Picker.Item key={s.value} label={s.label} value={s.value} />
                  ))}
                </Picker>
              </View>
            )}
            {errors.state && <Text style={styles.error}>{errors.state}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.buttonText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={[styles.linkText, { color: colors.primary }]}>← Back to Step 1</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...components.container,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  input: {
    ...components.input,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    marginBottom: spacing.sm,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  passwordIcon: { marginRight: spacing.sm },
  requirements: { marginTop: spacing.xs, marginBottom: spacing.lg },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  datePickerText: { fontSize: 16 },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  picker: { height: 200, width: '100%' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  button: {
    ...components.buttonPrimary,
    marginTop: spacing.lg,
  },
  buttonText: { ...typography.button },
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  linkText: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontWeight: '500',
  },
});
