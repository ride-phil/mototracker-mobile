import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getRideProgress, RideProgress } from '../services/progress';

type Props = NativeStackScreenProps<RootStackParamList, 'MyProgress'>;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:      { bg: '#1c1a0a', text: '#fbbf24', border: '#854d0e' },
  needs_review: { bg: '#1a0f0a', text: '#fb923c', border: '#9a3412' },
  accepted:     { bg: '#0a1a0f', text: '#86efac', border: '#166534' },
  rejected:     { bg: '#1a0a0a', text: '#fca5a5', border: '#991b1b' },
};

export default function MyProgressScreen({ route, navigation }: Props) {
  const { ride } = route.params;

  const [progress, setProgress]   = useState<RideProgress | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchProgress = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getRideProgress(ride.id);
      setProgress(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load progress.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ride.id]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const hitCount     = progress?.hits.length ?? 0;
  const pendingCount = progress?.pending.length ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Progress</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#38bdf8" size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProgress()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProgress(true)}
              tintColor="#38bdf8"
            />
          }
        >
          {/* Ride name */}
          <Text style={styles.rideName}>{ride.name}</Text>

          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{hitCount}</Text>
              <Text style={styles.summaryLabel}>Waypoints{'\n'}Hit</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardMiddle]}>
              <Text style={[styles.summaryNumber, styles.summaryNumberPending]}>{pendingCount}</Text>
              <Text style={styles.summaryLabel}>Pending{'\n'}Review</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardPct]}>
              <Text style={[styles.summaryNumber, styles.summaryNumberPct]}>
                {ride.completion_pct}%
              </Text>
              <Text style={styles.summaryLabel}>Complete</Text>
            </View>
          </View>

          {/* Points card */}
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <Text style={styles.pointsLabel}>RIDE POINTS</Text>
              <Text style={styles.pointsValue}>
                <Text style={styles.pointsCurrent}>{hitCount}</Text>
                <Text style={styles.pointsMax}> of {ride.total_waypoints} Max</Text>
              </Text>
            </View>
            <View style={styles.pointsTrack}>
              <View style={[
                styles.pointsFill,
                { width: ride.total_waypoints > 0 ? `${ride.completion_pct}%` : '0%' },
              ]} />
            </View>
          </View>

          {/* Waypoint Hits */}
          <Text style={styles.sectionTitle}>Confirmed Hits</Text>

          {hitCount === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No waypoints confirmed yet.</Text>
              <Text style={styles.emptySubText}>Submit evidence on the ride detail screen.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {progress!.hits.map((hit, index) => (
                <View key={`${hit.waypoint_id}-${index}`} style={styles.hitRow}>
                  <View style={styles.hitCheck}>
                    <Text style={styles.hitCheckText}>✓</Text>
                  </View>
                  <View style={styles.hitInfo}>
                    <Text style={styles.hitName}>{hit.waypoint_name ?? `Waypoint ${hit.waypoint_id}`}</Text>
                    <Text style={styles.hitDate}>{formatDate(hit.hit_at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Pending Verifications */}
          {pendingCount > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Pending Verifications</Text>
              <View style={styles.list}>
                {progress!.pending.map(v => {
                  const colors = STATUS_COLORS[v.status] ?? STATUS_COLORS.pending;
                  return (
                    <View key={v.id} style={styles.pendingRow}>
                      <View style={styles.pendingInfo}>
                        <Text style={styles.pendingType}>
                          {v.type === 'photo' ? '📷' : '📍'} {v.type.toUpperCase()}
                        </Text>
                        <Text style={styles.pendingDate}>{formatDate(v.created_at)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>
                          {v.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

        </ScrollView>
      )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  rideName: {
    color: '#64748b',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a2030',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  summaryCardMiddle: {
    borderColor: '#854d0e',
  },
  summaryCardPct: {
    borderColor: '#1e3a5f',
  },
  summaryNumber: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryNumberPending: {
    color: '#fbbf24',
  },
  summaryNumberPct: {
    color: '#38bdf8',
  },
  pointsCard: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 16,
    marginBottom: 28,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  pointsLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pointsValue: {
    fontSize: 16,
  },
  pointsCurrent: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
  },
  pointsMax: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '400',
  },
  pointsTrack: {
    height: 8,
    backgroundColor: '#2d3748',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pointsFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    borderRadius: 12,
    backgroundColor: '#1a2030',
    borderWidth: 1,
    borderColor: '#2d3748',
    overflow: 'hidden',
  },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  hitCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#14532d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#166534',
  },
  hitCheckText: {
    color: '#86efac',
    fontSize: 14,
    fontWeight: '700',
  },
  hitInfo: { flex: 1 },
  hitName: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '600',
  },
  hitDate: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  pendingInfo: { flex: 1 },
  pendingType: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingDate: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptySection: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  emptyText: {
    color: '#475569',
    fontSize: 15,
    marginBottom: 4,
  },
  emptySubText: {
    color: '#334155',
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1a2030',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  retryText: { color: '#38bdf8', fontWeight: '600' },
});
