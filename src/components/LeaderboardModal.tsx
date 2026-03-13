import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLeaderboardRides,
  getRideRankings,
  LeaderboardRide,
  LeaderboardRider,
  RideRankings,
} from '../services/leaderboard';

const RANK_COLOR: Record<number, string> = { 1: '#fbbf24', 2: '#94a3b8', 3: '#b45309' };

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  rally:    { bg: '#1d4ed8', text: '#bfdbfe' },
  explorer: { bg: '#15803d', text: '#bbf7d0' },
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  active:  { bg: '#14532d', text: '#86efac' },
  expired: { bg: '#1a0a0a', text: '#fca5a5' },
};

// ─── Ride Index ───────────────────────────────────────────────────────────────

function RideRow({ ride, onPress }: { ride: LeaderboardRide; onPress: () => void }) {
  const ts = TYPE_STYLE[ride.type]  ?? TYPE_STYLE.explorer;
  const ss = STATUS_STYLE[ride.status] ?? STATUS_STYLE.expired;

  return (
    <TouchableOpacity style={styles.rideCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rideCardTop}>
        <Text style={styles.rideName} numberOfLines={1}>{ride.name}</Text>
        <View style={styles.rideBadges}>
          <View style={[styles.badge, { backgroundColor: ts.bg }]}>
            <Text style={[styles.badgeText, { color: ts.text }]}>{ride.type.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: ss.bg }]}>
            <Text style={[styles.badgeText, { color: ss.text }]}>{ride.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.rideStats}>
        <View style={styles.rideStat}>
          <Text style={styles.rideStatNum}>{ride.rider_count}</Text>
          <Text style={styles.rideStatLabel}>Riders</Text>
        </View>
        <View style={styles.rideStat}>
          <Text style={styles.rideStatNum}>{ride.total_waypoints}</Text>
          <Text style={styles.rideStatLabel}>Waypoints</Text>
        </View>
        <View style={styles.rideStat}>
          <Text style={styles.rideStatNum}>{ride.avg_completion_pct}%</Text>
          <Text style={styles.rideStatLabel}>Avg Complete</Text>
        </View>
      </View>
      <Text style={styles.viewRankings}>View Rankings →</Text>
    </TouchableOpacity>
  );
}

// ─── Rankings View ────────────────────────────────────────────────────────────

function RiderRow({ rider, rank }: { rider: LeaderboardRider; rank: number }) {
  const initials = (rider.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rankColor = RANK_COLOR[rank] ?? '#475569';
  return (
    <View style={[styles.riderRow, rider.is_me && styles.riderRowMe]}>
      <View style={styles.rankCol}>
        <View style={[styles.avatarRing, { borderColor: rankColor }]}>
          {rider.avatar_url
            ? <Image source={{ uri: rider.avatar_url }} style={styles.avatarImg} />
            : <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
          }
        </View>
        <Text style={[styles.rankNum, { color: rankColor }]}>{rank}</Text>
      </View>
      <View style={styles.riderInfo}>
        <Text style={[styles.riderName, rider.is_me && styles.riderNameMe]} numberOfLines={1}>
          {rider.name}{rider.is_me ? ' (you)' : ''}
        </Text>
        {rider.riding_club ? (
          <Text style={styles.riderClub} numberOfLines={1}>{rider.riding_club}</Text>
        ) : null}
        <View style={styles.riderMethods}>
          {rider.gps_hits > 0 && <Text style={styles.methodTag}>📡 {rider.gps_hits}</Text>}
          {rider.gpx_hits > 0 && <Text style={styles.methodTag}>〰 {rider.gpx_hits}</Text>}
          {rider.photo_hits > 0 && <Text style={styles.methodTag}>📷 {rider.photo_hits}</Text>}
        </View>
      </View>
      <View style={styles.riderScore}>
        <Text style={[styles.riderPoints, rider.is_me && styles.riderPointsMe]}>
          {rider.total_points}
        </Text>
        <Text style={styles.riderPts}>pts</Text>
        <Text style={styles.riderPct}>{rider.pct}%</Text>
      </View>
    </View>
  );
}

function RankingsView({
  ride,
  rankings,
  loading,
  refreshing,
  onRefresh,
  error,
}: {
  ride: LeaderboardRide;
  rankings: RideRankings | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  error: string | null;
}) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
    >
      {/* Ride summary strip */}
      <View style={styles.rankingSummary}>
        <View style={styles.rankingStat}>
          <Text style={styles.rankingStatNum}>{rankings?.riders.length ?? 0}</Text>
          <Text style={styles.rankingStatLabel}>Riders</Text>
        </View>
        <View style={styles.rankingStat}>
          <Text style={styles.rankingStatNum}>{rankings?.total_waypoints ?? 0}</Text>
          <Text style={styles.rankingStatLabel}>Waypoints</Text>
        </View>
        <View style={styles.rankingStat}>
          <Text style={styles.rankingStatNum}>{rankings?.max_possible_points ?? 0}</Text>
          <Text style={styles.rankingStatLabel}>Max Pts</Text>
        </View>
      </View>

      {rankings?.riders.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No riders on the board yet.</Text>
        </View>
      ) : (
        <View style={styles.riderList}>
          {rankings?.riders.map((rider, i) => (
            <RiderRow key={rider.user_id} rider={rider} rank={i + 1} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ visible, onClose }: Props) {
  const [rides, setRides]               = useState<LeaderboardRide[]>([]);
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const [selectedRide, setSelectedRide]     = useState<LeaderboardRide | null>(null);
  const [rankings, setRankings]             = useState<RideRankings | null>(null);
  const [rankLoading, setRankLoading]       = useState(false);
  const [rankRefreshing, setRankRefreshing] = useState(false);
  const [rankError, setRankError]           = useState<string | null>(null);

  const fetchRides = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setRides(await getLeaderboardRides());
    } catch (e: any) {
      setError(e.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchRankings = useCallback(async (ride: LeaderboardRide, isRefresh = false) => {
    if (isRefresh) setRankRefreshing(true);
    else setRankLoading(true);
    setRankError(null);
    try {
      setRankings(await getRideRankings(ride.id));
    } catch (e: any) {
      setRankError(e.message || 'Failed to load rankings.');
    } finally {
      setRankLoading(false);
      setRankRefreshing(false);
    }
  }, []);

  function handleOpen() {
    setSelectedRide(null);
    setRankings(null);
    fetchRides();
  }

  function handleSelectRide(ride: LeaderboardRide) {
    setSelectedRide(ride);
    setRankings(null);
    fetchRankings(ride);
  }

  function handleBack() {
    setSelectedRide(null);
    setRankings(null);
  }

  const title = selectedRide ? selectedRide.name : 'Leaderboard';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={selectedRide ? handleBack : onClose} style={styles.headerBack}>
            <Text style={styles.headerBackText}>{selectedRide ? '← Back' : '✕'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {selectedRide ? (
          <RankingsView
            ride={selectedRide}
            rankings={rankings}
            loading={rankLoading}
            refreshing={rankRefreshing}
            onRefresh={() => fetchRankings(selectedRide, true)}
            error={rankError}
          />
        ) : loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#38bdf8" size="large" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchRides()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRides(true)} tintColor="#38bdf8" />}
          >
            {rides.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No rides available.</Text>
              </View>
            ) : (
              rides.map(ride => (
                <RideRow key={ride.id} ride={ride} onPress={() => handleSelectRide(ride)} />
              ))
            )}
          </ScrollView>
        )}

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  headerBack: { width: 60 },
  headerBackText: { color: '#38bdf8', fontSize: 15 },
  headerTitle: { flex: 1, color: '#f1f5f9', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  headerSpacer: { width: 60 },

  scrollContent: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Ride index cards
  rideCard: {
    backgroundColor: '#1a2030',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 16,
    marginBottom: 12,
  },
  rideCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  rideName: { color: '#f1f5f9', fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  rideBadges: { flexDirection: 'row', gap: 6 },
  badge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  rideStats: { flexDirection: 'row', gap: 0, marginBottom: 12 },
  rideStat: { flex: 1, alignItems: 'center' },
  rideStatNum: { color: '#38bdf8', fontSize: 20, fontWeight: '700' },
  rideStatLabel: { color: '#475569', fontSize: 11, marginTop: 2 },
  viewRankings: { color: '#38bdf8', fontSize: 13, textAlign: 'right' },

  // Rankings summary strip
  rankingSummary: {
    flexDirection: 'row',
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 16,
    marginBottom: 16,
  },
  rankingStat: { flex: 1, alignItems: 'center' },
  rankingStatNum: { color: '#38bdf8', fontSize: 22, fontWeight: '700' },
  rankingStatLabel: { color: '#475569', fontSize: 11, marginTop: 2 },

  // Rider rows
  riderList: {
    borderRadius: 12,
    backgroundColor: '#1a2030',
    borderWidth: 1,
    borderColor: '#2d3748',
    overflow: 'hidden',
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  riderRowMe: {
    backgroundColor: '#0c1f2e',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  rankCol: { width: 44, alignItems: 'center', marginRight: 10 },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 3,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    flex: 1,
    backgroundColor: '#1a2030',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  rankNum: { fontSize: 11, fontWeight: '700' },
  riderInfo: { flex: 1, marginRight: 8 },
  riderName: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  riderNameMe: { color: '#38bdf8' },
  riderClub: { color: '#475569', fontSize: 12, marginTop: 1 },
  riderMethods: { flexDirection: 'row', gap: 8, marginTop: 4 },
  methodTag: { color: '#64748b', fontSize: 11 },
  riderScore: { alignItems: 'flex-end' },
  riderPoints: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  riderPointsMe: { color: '#38bdf8' },
  riderPts: { color: '#475569', fontSize: 10, marginTop: -2 },
  riderPct: { color: '#64748b', fontSize: 11, marginTop: 2 },

  emptySection: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  emptyText: { color: '#475569', fontSize: 15 },
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
});
