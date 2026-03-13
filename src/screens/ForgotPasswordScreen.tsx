import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { forgotPassword } from '../services/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centred}>
          <Text style={styles.logo}>MotoTracker</Text>
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successBody}>
              If that email is registered, we've sent a reset link. The link will open a browser page to complete your reset.
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.centred}>
          <Text style={styles.logo}>MotoTracker</Text>
          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subheading}>Enter your email and we'll send a reset link.</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0f1117" />
              : <Text style={styles.buttonText}>Send Reset Link</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.goBack()}>
            <Text style={styles.link}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  centred: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  heading: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  subheading: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: '#1a0a0a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#991b1b',
    padding: 14,
    marginBottom: 16,
  },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  input: {
    backgroundColor: '#1a2030',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
    color: '#f1f5f9',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0f1117', fontWeight: '700', fontSize: 16 },
  linkRow: { alignItems: 'center' },
  link: { color: '#38bdf8', fontSize: 14, fontWeight: '600' },
  successBox: {
    backgroundColor: '#0a1f0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#166534',
    padding: 20,
    marginTop: 16,
    marginBottom: 28,
  },
  successTitle: {
    color: '#86efac',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successBody: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
