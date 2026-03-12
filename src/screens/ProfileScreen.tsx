import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getStoredUser, logout, AuthUser } from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'> & {
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
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  function confirmLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
      ]
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      onLogout();
    } catch {
      // Token may already be invalid — still clear locally
      onLogout();
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Avatar placeholder + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.display_name?.[0]?.toUpperCase() ?? user?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{user?.display_name ?? user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Rider details */}
        {(user?.bike || user?.riding_club) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rider Info</Text>
            <Row label="Bike" value={user?.bike} />
            <Row label="Club" value={user?.riding_club} />
          </View>
        )}

        {/* App info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Server</Text>
            <Text style={styles.rowValue}>app.mototracker.app</Text>
          </View>
        </View>

        {/* Logout */}
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
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  backButton: { paddingVertical: 4 },
  backText: { color: '#38bdf8', fontSize: 16 },
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a2030',
    borderWidth: 2,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#38bdf8',
    fontSize: 32,
    fontWeight: '700',
  },
  displayName: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
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
  rowLabel: {
    color: '#64748b',
    fontSize: 14,
  },
  rowValue: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#1a0a0a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#991b1b',
    marginTop: 8,
  },
  logoutDisabled: {
    opacity: 0.5,
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '600',
  },
});
