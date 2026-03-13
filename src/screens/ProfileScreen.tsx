import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';
import { logout } from '../services/auth';
import { getFullProfile, FullProfile } from '../services/profile';
import HamburgerButton from '../components/HamburgerButton';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'> & {
  onLogout: () => void;
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation, onLogout }: Props) {
  const [profile, setProfile]     = useState<FullProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const p = await getFullProfile();
      setProfile(p);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh when returning from EditProfile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [navigation, fetchProfile]);

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
    ]);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      onLogout();
    } catch {
      onLogout();
    }
  }

  const initials = profile?.name?.[0]?.toUpperCase() ?? '?';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <HamburgerButton />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color="#38bdf8" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <HamburgerButton />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor="#38bdf8" />}
      >
        {/* Avatar + identity */}
        <View style={styles.avatarSection}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          )}

          <Text style={styles.displayName}>{profile?.name}</Text>
          {profile?.username ? (
            <Text style={styles.username}>@{profile.username}</Text>
          ) : null}
          <Text style={styles.email}>{profile?.email}</Text>

          <View style={styles.metaRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
            </View>
            {profile?.location ? (
              <Text style={styles.location}>📍 {profile.location}</Text>
            ) : null}
          </View>

          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}
        </View>

        {/* Rider info */}
        {(profile?.bike || profile?.riding_style || profile?.riding_club) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rider Info</Text>
            <Row label="Motorcycle" value={profile?.bike} />
            <Row label="Style"      value={profile?.riding_style} />
            <Row label="Club"       value={profile?.riding_club} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && styles.logoutDisabled]}
          onPress={confirmLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ActivityIndicator color="#fca5a5" />
            : <Text style={styles.logoutText}>Sign Out</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editButton: { paddingVertical: 4 },
  editButtonText: { color: '#38bdf8', fontSize: 15, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#38bdf8',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1a2030',
    borderWidth: 2,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: { color: '#38bdf8', fontSize: 36, fontWeight: '700' },
  displayName: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 2 },
  username: { color: '#475569', fontSize: 14, marginBottom: 4 },
  email: { color: '#64748b', fontSize: 14, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  roleBadge: {
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: { color: '#7dd3fc', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  location: { color: '#64748b', fontSize: 13 },
  bio: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  card: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  rowLabel: { color: '#64748b', fontSize: 14 },
  rowValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },
  logoutButton: {
    backgroundColor: '#1a0a0a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#991b1b',
    marginTop: 8,
  },
  logoutDisabled: { opacity: 0.5 },
  logoutText: { color: '#fca5a5', fontSize: 16, fontWeight: '600' },
});
