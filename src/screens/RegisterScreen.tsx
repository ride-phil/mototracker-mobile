import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { register } from '../services/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'> & {
  onRegisterSuccess: () => void;
};

export default function RegisterScreen({ navigation, onRegisterSuccess }: Props) {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [inviteCode, setInviteCode]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleRegister() {
    setErrors({});
    setGlobalError(null);

    const localErrors: Record<string, string> = {};
    if (!name.trim())     localErrors.name     = 'Name is required.';
    if (!email.trim())    localErrors.email    = 'Email is required.';
    if (!password)        localErrors.password = 'Password is required.';
    if (password !== confirm) localErrors.confirm = 'Passwords do not match.';
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: confirm,
        ...(inviteCode.trim() ? { invite_code: inviteCode.trim() } : {}),
      });
      onRegisterSuccess();
    } catch (e: any) {
      if (e?.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(e.errors)) {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        }
        setErrors(mapped);
      } else {
        setGlobalError(e?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.logo}>MotoTracker</Text>
          <Text style={styles.heading}>Create Account</Text>

          {globalError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{globalError}</Text>
            </View>
          ) : null}

          <Field label="Full Name" error={errors.name}>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="Your name"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="you@example.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="Password"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Field>

          <Field label="Confirm Password" error={errors.confirm}>
            <TextInput
              style={[styles.input, errors.confirm ? styles.inputError : null]}
              placeholder="Confirm password"
              placeholderTextColor="#475569"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
          </Field>

          <Field label="Invite Code (if required)" error={errors.invite_code}>
            <TextInput
              style={[styles.input, errors.invite_code ? styles.inputError : null]}
              placeholder="Leave blank if not required"
              placeholderTextColor="#475569"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0f1117" />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign In</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  scroll: { padding: 24, paddingBottom: 48 },
  logo: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 16,
    letterSpacing: 1,
  },
  heading: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
  },
  errorBanner: {
    backgroundColor: '#1a0a0a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#991b1b',
    padding: 14,
    marginBottom: 20,
  },
  errorBannerText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: '#1a2030',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
    color: '#f1f5f9',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: { borderColor: '#991b1b' },
  fieldError: { color: '#fca5a5', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0f1117', fontWeight: '700', fontSize: 16 },
  linkRow: { alignItems: 'center' },
  linkText: { color: '#64748b', fontSize: 14 },
  link: { color: '#38bdf8', fontWeight: '600' },
});
