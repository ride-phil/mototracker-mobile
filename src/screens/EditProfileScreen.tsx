import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { ProfileStackParamList } from '../types/navigation';
import { getFullProfile, updateProfile, uploadAvatar, updatePassword, FullProfile } from '../services/profile';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const [profile, setProfile]   = useState<FullProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [name, setName]               = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation]       = useState('');
  const [bike, setBike]               = useState('');
  const [ridingStyle, setRidingStyle] = useState('');
  const [ridingClub, setRidingClub]   = useState('');
  const [bio, setBio]                 = useState('');

  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileErrors, setProfileErrors]   = useState<Record<string, string>>({});

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwErrors, setPwErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    getFullProfile().then((p) => {
      setProfile(p);
      setName(p.name ?? '');
      setUsername(p.username ?? '');
      setLocation(p.location ?? '');
      setBike(p.bike ?? '');
      setRidingStyle(p.riding_style ?? '');
      setRidingClub(p.riding_club ?? '');
      setBio(p.bio ?? '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setAvatarUri(uri);
    setAvatarUploading(true);
    try {
      const newUrl = await uploadAvatar(uri);
      setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : prev);
    } catch {
      // Avatar will still show locally; upload error is non-fatal
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveProfile() {
    setProfileErrors({});
    setProfileSuccess(false);
    setProfileSaving(true);
    try {
      await updateProfile({
        name:                     name.trim()      || undefined,
        username:                 username.trim()  || null,
        location:                 location.trim()    || null,
        bike:                     bike.trim()        || null,
        riding_style:             ridingStyle.trim() || null,
        riding_club:              ridingClub.trim()  || null,
        bio:                      bio.trim()         || null,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e: any) {
      if (e?.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(e.errors)) {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        }
        setProfileErrors(mapped);
      } else {
        setProfileErrors({ general: e?.message || 'Failed to save profile.' });
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleUpdatePassword() {
    setPwErrors({});
    setPwSuccess(false);
    const localErrors: Record<string, string> = {};
    if (!currentPw)          localErrors.current_password = 'Current password is required.';
    if (!newPw)              localErrors.password         = 'New password is required.';
    if (newPw !== confirmPw) localErrors.confirm          = 'Passwords do not match.';
    if (Object.keys(localErrors).length > 0) { setPwErrors(localErrors); return; }

    setPwSaving(true);
    try {
      await updatePassword(currentPw, newPw, confirmPw);
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e: any) {
      if (e?.errors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(e.errors)) {
          mapped[key] = Array.isArray(messages) ? messages[0] : String(messages);
        }
        setPwErrors(mapped);
      } else {
        setPwErrors({ general: e?.message || 'Failed to update password.' });
      }
    } finally {
      setPwSaving(false);
    }
  }

  const avatarSource = avatarUri ?? profile?.avatar_url ?? null;
  const initials = name?.[0]?.toUpperCase() ?? '?';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centered}><ActivityIndicator color="#38bdf8" size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Avatar picker */}
          <TouchableOpacity style={styles.avatarRow} onPress={pickAvatar} disabled={avatarUploading}>
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarOverlay}>
              {avatarUploading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.avatarOverlayText}>Change</Text>
              }
            </View>
          </TouchableOpacity>

          {/* Profile info */}
          <Text style={styles.sectionTitle}>Profile Info</Text>
          {profileErrors.general ? <ErrorBanner message={profileErrors.general} /> : null}
          {profileSuccess ? <SuccessBanner message="Profile saved." /> : null}

          <Field label="Full Name" error={profileErrors.name}>
            <TextInput style={[styles.input, profileErrors.name ? styles.inputError : null]}
              value={name} onChangeText={setName} placeholder="Your full name"
              placeholderTextColor="#475569" autoCapitalize="words" />
          </Field>

          <Field label="Username" error={profileErrors.username}>
            <TextInput style={[styles.input, profileErrors.username ? styles.inputError : null]}
              value={username} onChangeText={setUsername} placeholder="e.g. MotoTracker"
              placeholderTextColor="#475569" autoCapitalize="none" autoCorrect={false} />
          </Field>

          <Field label="Location" error={profileErrors.location}>
            <TextInput style={[styles.input, profileErrors.location ? styles.inputError : null]}
              value={location} onChangeText={setLocation} placeholder="e.g. Cavite, Philippines"
              placeholderTextColor="#475569" />
          </Field>

          <Field label="About You" error={profileErrors.bio}>
            <TextInput style={[styles.input, styles.textArea, profileErrors.bio ? styles.inputError : null]}
              value={bio} onChangeText={setBio} placeholder="A short bio..."
              placeholderTextColor="#475569" multiline numberOfLines={4} textAlignVertical="top" />
          </Field>

          {/* Rider info */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Rider Info</Text>

          <Field label="Motorcycle" error={profileErrors.bike}>
            <TextInput style={[styles.input, profileErrors.bike ? styles.inputError : null]}
              value={bike} onChangeText={setBike} placeholder="e.g. 2013 BMW F800GS"
              placeholderTextColor="#475569" />
          </Field>

          <Field label="Riding Style" error={profileErrors.riding_style}>
            <TextInput style={[styles.input, profileErrors.riding_style ? styles.inputError : null]}
              value={ridingStyle} onChangeText={setRidingStyle} placeholder="e.g. Touring, Adventure"
              placeholderTextColor="#475569" />
          </Field>

          <Field label="Riding Club" error={profileErrors.riding_club}>
            <TextInput style={[styles.input, profileErrors.riding_club ? styles.inputError : null]}
              value={ridingClub} onChangeText={setRidingClub} placeholder="e.g. Iron Riders MC"
              placeholderTextColor="#475569" />
          </Field>

          <TouchableOpacity
            style={[styles.button, profileSaving && styles.buttonDisabled]}
            onPress={handleSaveProfile} disabled={profileSaving}
          >
            {profileSaving ? <ActivityIndicator color="#0f1117" /> : <Text style={styles.buttonText}>Save Changes</Text>}
          </TouchableOpacity>

          {/* Change password */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Change Password</Text>
          {pwErrors.general ? <ErrorBanner message={pwErrors.general} /> : null}
          {pwSuccess ? <SuccessBanner message="Password updated." /> : null}

          <Field label="Current Password" error={pwErrors.current_password}>
            <TextInput style={[styles.input, pwErrors.current_password ? styles.inputError : null]}
              value={currentPw} onChangeText={setCurrentPw} placeholder="Current password"
              placeholderTextColor="#475569" secureTextEntry />
          </Field>

          <Field label="New Password" error={pwErrors.password}>
            <TextInput style={[styles.input, pwErrors.password ? styles.inputError : null]}
              value={newPw} onChangeText={setNewPw} placeholder="New password"
              placeholderTextColor="#475569" secureTextEntry />
          </Field>

          <Field label="Confirm New Password" error={pwErrors.confirm}>
            <TextInput style={[styles.input, pwErrors.confirm ? styles.inputError : null]}
              value={confirmPw} onChangeText={setConfirmPw} placeholder="Confirm new password"
              placeholderTextColor="#475569" secureTextEntry />
          </Field>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, pwSaving && styles.buttonDisabled]}
            onPress={handleUpdatePassword} disabled={pwSaving}
          >
            {pwSaving ? <ActivityIndicator color="#38bdf8" /> : <Text style={styles.buttonSecondaryText}>Update Password</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Profile</Text>
      <View style={{ width: 60 }} />
    </View>
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

function ErrorBanner({ message }: { message: string }) {
  return <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{message}</Text></View>;
}

function SuccessBanner({ message }: { message: string }) {
  return <View style={styles.successBanner}><Text style={styles.successBannerText}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a2030',
  },
  backButton: { paddingVertical: 4, width: 60 },
  backText: { color: '#38bdf8', fontSize: 16 },
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 48 },
  avatarRow: { alignItems: 'center', marginBottom: 24 },
  avatarImage: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, borderColor: '#38bdf8',
  },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#1a2030', borderWidth: 2, borderColor: '#38bdf8',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#38bdf8', fontSize: 36, fontWeight: '700' },
  avatarOverlay: {
    position: 'absolute', bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderBottomLeftRadius: 45, borderBottomRightRadius: 45,
    width: 90, alignItems: 'center', paddingVertical: 4,
  },
  avatarOverlayText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    color: '#475569', fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: '#1a2030', borderRadius: 10, borderWidth: 1,
    borderColor: '#2d3748', color: '#f1f5f9', fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  textArea: { minHeight: 100 },
  inputError: { borderColor: '#991b1b' },
  fieldError: { color: '#fca5a5', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#38bdf8', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 4, marginBottom: 8,
  },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#38bdf8' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0f1117', fontWeight: '700', fontSize: 16 },
  buttonSecondaryText: { color: '#38bdf8', fontWeight: '700', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#1a2030', marginVertical: 28 },
  errorBanner: {
    backgroundColor: '#1a0a0a', borderRadius: 10, borderWidth: 1,
    borderColor: '#991b1b', padding: 12, marginBottom: 16,
  },
  errorBannerText: { color: '#fca5a5', fontSize: 14 },
  successBanner: {
    backgroundColor: '#0a1f0a', borderRadius: 10, borderWidth: 1,
    borderColor: '#166534', padding: 12, marginBottom: 16,
  },
  successBannerText: { color: '#86efac', fontSize: 14 },
});
