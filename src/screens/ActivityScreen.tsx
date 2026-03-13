import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';
import HamburgerButton from '../components/HamburgerButton';

interface Verification {
  id: number;
  ride_id: number;
  ride_name: string | null;
  waypoint_id: number;
  waypoint_name: string | null;
  type: 'photo' | 'gpx';
  status: 'pending' | 'accepted' | 'rejected' | 'needs_review';
  submitted_at: string | null;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:      { bg: '#1c1a0a', text: '#fbbf24', label: 'Pending' },
  accepted:     { bg: '#0a1f0a', text: '#86efac', label: 'Accepted' },
  rejected:     { bg: '#1a0a0a', text: '#fca5a5', label: 'Rejected' },
  needs_review: { bg: '#1a0f0a', text: '#fb923c', label: 'Needs Review' },
};

const TYPE_ICON: Record<string, string> = {
  photo: '📷',
  gpx:   '📍',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActivityScreen() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const fetchActivity = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Verification[] }>('/verifications');
      setVerifications(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}><ActivityIndicator color="#38bdf8" size="large" /></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchActivity()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <FlatList
        data={verifications}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={verifications.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchActivity(true)} tintColor="#38bdf8" />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No submissions yet.{'\n'}Join a ride to get started.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
          return (
            <View style={styles.row}>
              <Text style={styles.typeIcon}>{TYPE_ICON[item.type] ?? '📋'}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.waypointName} numberOfLines={1}>
                  {item.waypoint_name ?? 'Unknown waypoint'}
                </Text>
                <Text style={styles.rideName} numberOfLines={1}>
                  {item.ride_name ?? 'Unknown ride'}
                </Text>
                <Text style={styles.date}>{formatDate(item.submitted_at)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Activity</Text>
      <HamburgerButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  headerTitle: { color: '#f1f5f9', fontSize: 22, fontWeight: '700' },
  listContent: { padding: 16 },
  emptyContainer: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 14,
    gap: 12,
  },
  typeIcon: { fontSize: 24 },
  rowBody: { flex: 1 },
  waypointName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rideName: { color: '#64748b', fontSize: 13, marginBottom: 4 },
  date: { color: '#475569', fontSize: 12 },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  separator: { height: 10 },
  errorText: { color: '#fca5a5', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#1a2030',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  retryText: { color: '#38bdf8', fontWeight: '600' },
  emptyText: { color: '#475569', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
