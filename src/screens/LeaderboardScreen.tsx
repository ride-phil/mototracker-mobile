import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getLeaderboardRides,
  getRideRankings,
  getRiderProfile,
  LeaderboardRide,
  LeaderboardRider,
  RideRankings,
  RiderProfile,
} from '../services/leaderboard';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

const RANK_COLOR: Record<number, string> = { 1: '#fbbf24', 2: '#94a3b8', 3: '#b45309' };

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  rally:    { bg: '#1d4ed8', text: '#bfdbfe' },
  explorer: { bg: '#15803d', text: '#bbf7d0' },
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  active:  { bg: '#14532d', text: '#86efac' },
  expired: { bg: '#1a0a0a', text: '#fca5a5' },
};

function RideRow({ ride, onPress }: { ride: LeaderboardRide; onPress: () => void }) {
  const ts = TYPE_STYLE[ride.type]     ?? TYPE_STYLE.explorer;
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

function RiderRow({ rider, rank, onPress }: { rider: LeaderboardRider; rank: number; onPress: () => void }) {
  const initials  = (rider.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rankColor = RANK_COLOR[rank] ?? '#475569';
  return (
    <TouchableOpacity style={[styles.riderRow, rider.is_me && styles.riderRowMe]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rankCol}>
        <View style={[styles.avatarRing, { borderColor: rankColor }]}>
          {rider.avatar_url
            ? <Image source={{ uri: rider.avatar_url }} style={styles.avatarImg} />
            : <View style={styles.avatarFallback}><Text style={styles.avatarInitials}>{initials}</Text></View>
          }
        </View>
        <Text style={[styles.rankNum, { color: rankColor }]}>{rank}</Text>
      </View>
      <View style={styles.riderInfo}>
        <Text style={[styles.riderName, rider.is_me && styles.riderNameMe]} numberOfLines={1}>
          {rider.name}{rider.is_me ? ' (you)' : ''}
        </Text>
        {rider.riding_club ? <Text style={styles.riderClub} numberOfLines={1}>{rider.riding_club}</Text> : null}
        <View style={styles.riderMethods}>
          {rider.gps_hits   > 0 && <Text style={styles.methodTag}>📡 {rider.gps_hits}</Text>}
          {rider.gpx_hits   > 0 && <Text style={styles.methodTag}>〰 {rider.gpx_hits}</Text>}
          {rider.photo_hits > 0 && <Text style={styles.methodTag}>📷 {rider.photo_hits}</Text>}
        </View>
      </View>
      <View style={styles.riderScore}>
        <Text style={[styles.riderPoints, rider.is_me && styles.riderPointsMe]}>{rider.total_points}</Text>
        <Text style={styles.riderPts}>pts</Text>
        <Text style={styles.riderPct}>{rider.pct}%</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen({ navigation }: Props) {
  const [rides, setRides]             = useState<LeaderboardRide[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [selectedRide, setSelectedRide]     = useState<LeaderboardRide | null>(null);
  const [rankings, setRankings]             = useState<RideRankings | null>(null);
  const [rankLoading, setRankLoading]       = useState(false);
  const [rankRefreshing, setRankRefreshing] = useState(false);
  const [rankError, setRankError]           = useState<string | null>(null);

  const [selectedRider, setSelectedRider] = useState<LeaderboardRider | null>(null);
  const [profile, setProfile]             = useState<RiderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError]   = useState<string | null>(null);

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

  const fetchProfile = useCallback(async (userId: number) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      setProfile(await getRiderProfile(userId));
    } catch (e: any) {
      setProfileError(e.message || 'Failed to load rider profile.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  function handleSelectRide(ride: LeaderboardRide) {
    setSelectedRide(ride);
    setSelectedRider(null);
    setRankings(null);
    setProfile(null);
    fetchRankings(ride);
  }

  function handleSelectRider(rider: LeaderboardRider) {
    setSelectedRider(rider);
    setProfile(null);
    fetchProfile(rider.user_id);
  }

  function handleBack() {
    if (selectedRider) {
      setSelectedRider(null);
      setProfile(null);
    } else if (selectedRide) {
      setSelectedRide(null);
      setRankings(null);
    } else {
      navigation.goBack();
    }
  }

  const title    = selectedRider ? (selectedRider.name ?? 'Rider') : selectedRide ? selectedRide.name : 'Leaderboard';
  const showBack = !!(selectedRide || selectedRider);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {selectedRider ? (
        <RiderProfileView
          profile={profile}
          loading={profileLoading}
          error={profileError}
          onRetry={() => fetchProfile(selectedRider.user_id)}
        />
      ) : selectedRide ? (
        <RankingsView
          rankings={rankings}
          loading={rankLoading}
          refreshing={rankRefreshing}
          onRefresh={() => fetchRankings(selectedRide, true)}
          error={rankError}
          onSelectRider={handleSelectRider}
        />
      ) : loading ? (
        <View style={styles.centered}><ActivityIndicator color="#38bdf8" size="large" /></View>
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
          {rides.length === 0
            ? <View style={styles.emptySection}><Text style={styles.emptyText}>No rides available.</Text></View>
            : rides.map(ride => <RideRow key={ride.id} ride={ride} onPress={() => handleSelectRide(ride)} />)
          }
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RankingsView({ rankings, loading, refreshing, onRefresh, error, onSelectRider }: {
  rankings: RideRankings | null;
  loading: boolean; refreshing: boolean; onRefresh: () => void; error: string | null;
  onSelectRider: (rider: LeaderboardRider) => void;
}) {
  if (loading) return <View style={styles.centered}><ActivityIndicator color="#38bdf8" size="large" /></View>;
  if (error)   return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onRefresh} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}>
      <View style={styles.rankingSummary}>
        <View style={styles.rankingStat}><Text style={styles.rankingStatNum}>{rankings?.riders.length ?? 0}</Text><Text style={styles.rankingStatLabel}>Riders</Text></View>
        <View style={styles.rankingStat}><Text style={styles.rankingStatNum}>{rankings?.total_waypoints ?? 0}</Text><Text style={styles.rankingStatLabel}>Waypoints</Text></View>
        <View style={styles.rankingStat}><Text style={styles.rankingStatNum}>{rankings?.max_possible_points ?? 0}</Text><Text style={styles.rankingStatLabel}>Max Pts</Text></View>
      </View>
      {rankings?.riders.length === 0
        ? <View style={styles.emptySection}><Text style={styles.emptyText}>No riders on the board yet.</Text></View>
        : <View style={styles.riderList}>{rankings?.riders.map((rider, i) => <RiderRow key={rider.user_id} rider={rider} rank={i + 1} onPress={() => onSelectRider(rider)} />)}</View>
      }
    </ScrollView>
  );
}

function RiderProfileView({ profile, loading, error, onRetry }: {
  profile: RiderProfile | null; loading: boolean; error: string | null; onRetry: () => void;
}) {
  if (loading) return <View style={styles.centered}><ActivityIndicator color="#38bdf8" size="large" /></View>;
  if (error)   return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
    </View>
  );
  if (!profile) return null;
  const initials = (profile.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatarRing}>
          {profile.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.profileAvatarImg} />
            : <View style={styles.profileAvatarFallback}><Text style={styles.profileAvatarInitials}>{initials}</Text></View>
          }
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        {profile.username ? <Text style={styles.profileUsername}>@{profile.username}</Text> : null}
        {profile.location ? <Text style={styles.profileLocation}>{profile.location}</Text> : null}
      </View>
      {profile.bio ? <View style={styles.profileBioCard}><Text style={styles.profileBio}>{profile.bio}</Text></View> : null}
      {(profile.bike || profile.riding_style || profile.riding_club) ? (
        <View style={styles.profileInfoCard}>
          {profile.bike         ? <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Bike</Text><Text style={styles.profileInfoValue}>{profile.bike}</Text></View> : null}
          {profile.riding_style ? <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Style</Text><Text style={styles.profileInfoValue}>{profile.riding_style}</Text></View> : null}
          {profile.riding_club  ? <View style={styles.profileInfoRow}><Text style={styles.profileInfoLabel}>Club</Text><Text style={styles.profileInfoValue}>{profile.riding_club}</Text></View> : null}
        </View>
      ) : null}
      <View style={styles.profileStatsGrid}>
        {[
          { label: 'Rides',     value: profile.stats.total_rides },
          { label: 'Waypoints', value: profile.stats.waypoint_credits },
          { label: 'GPS',       value: profile.stats.gps_credits },
          { label: 'Photos',    value: profile.stats.accepted_photo_submissions },
          { label: 'GPX',       value: profile.stats.accepted_gpx_submissions },
        ].map(s => (
          <View key={s.label} style={styles.profileStatBox}>
            <Text style={styles.profileStatNum}>{s.value}</Text>
            <Text style={styles.profileStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      {(profile.facebook_url || profile.instagram_url || profile.tiktok_url || profile.website_url) ? (
        <View style={styles.socialLinks}>
          {profile.facebook_url  ? <TouchableOpacity onPress={() => Linking.openURL(profile.facebook_url!)}  style={styles.socialLink}><Text style={styles.socialLinkText}>Facebook</Text></TouchableOpacity>  : null}
          {profile.instagram_url ? <TouchableOpacity onPress={() => Linking.openURL(profile.instagram_url!)} style={styles.socialLink}><Text style={styles.socialLinkText}>Instagram</Text></TouchableOpacity> : null}
          {profile.tiktok_url    ? <TouchableOpacity onPress={() => Linking.openURL(profile.tiktok_url!)}    style={styles.socialLink}><Text style={styles.socialLinkText}>TikTok</Text></TouchableOpacity>    : null}
          {profile.website_url   ? <TouchableOpacity onPress={() => Linking.openURL(profile.website_url!)}   style={styles.socialLink}><Text style={styles.socialLinkText}>Website</Text></TouchableOpacity>   : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a2030' },
  headerBack: { width: 60 },
  headerBackText: { color: '#38bdf8', fontSize: 15 },
  headerTitle: { flex: 1, color: '#f1f5f9', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  headerSpacer: { width: 60 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  rideCard: { backgroundColor: '#1a2030', borderRadius: 14, borderWidth: 1, borderColor: '#2d3748', padding: 16, marginBottom: 12 },
  rideCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  rideName: { color: '#f1f5f9', fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  rideBadges: { flexDirection: 'row', gap: 6 },
  badge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  rideStats: { flexDirection: 'row', marginBottom: 12 },
  rideStat: { flex: 1, alignItems: 'center' },
  rideStatNum: { color: '#38bdf8', fontSize: 20, fontWeight: '700' },
  rideStatLabel: { color: '#475569', fontSize: 11, marginTop: 2 },
  viewRankings: { color: '#38bdf8', fontSize: 13, textAlign: 'right' },
  rankingSummary: { flexDirection: 'row', backgroundColor: '#1a2030', borderRadius: 12, borderWidth: 1, borderColor: '#2d3748', padding: 16, marginBottom: 16 },
  rankingStat: { flex: 1, alignItems: 'center' },
  rankingStatNum: { color: '#38bdf8', fontSize: 22, fontWeight: '700' },
  rankingStatLabel: { color: '#475569', fontSize: 11, marginTop: 2 },
  riderList: { borderRadius: 12, backgroundColor: '#1a2030', borderWidth: 1, borderColor: '#2d3748', overflow: 'hidden' },
  riderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#2d3748' },
  riderRowMe: { backgroundColor: '#0c1f2e', borderLeftWidth: 3, borderLeftColor: '#38bdf8' },
  rankCol: { width: 44, alignItems: 'center', marginRight: 10 },
  avatarRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, overflow: 'hidden', marginBottom: 3 },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, backgroundColor: '#1a2030', justifyContent: 'center', alignItems: 'center' },
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
  emptySection: { backgroundColor: '#1a2030', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#2d3748' },
  emptyText: { color: '#475569', fontSize: 15 },
  errorText: { color: '#fca5a5', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#1a2030', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: '#2d3748' },
  retryText: { color: '#38bdf8', fontWeight: '600' },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  profileAvatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#38bdf8', overflow: 'hidden', marginBottom: 14 },
  profileAvatarImg: { width: '100%', height: '100%' },
  profileAvatarFallback: { flex: 1, backgroundColor: '#1a2030', justifyContent: 'center', alignItems: 'center' },
  profileAvatarInitials: { color: '#94a3b8', fontSize: 28, fontWeight: '700' },
  profileName: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileUsername: { color: '#475569', fontSize: 14, marginBottom: 4 },
  profileLocation: { color: '#64748b', fontSize: 13 },
  profileBioCard: { backgroundColor: '#1a2030', borderRadius: 12, borderWidth: 1, borderColor: '#2d3748', padding: 16, marginBottom: 12 },
  profileBio: { color: '#94a3b8', fontSize: 14, lineHeight: 21 },
  profileInfoCard: { backgroundColor: '#1a2030', borderRadius: 12, borderWidth: 1, borderColor: '#2d3748', padding: 16, marginBottom: 12 },
  profileInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2d3748' },
  profileInfoLabel: { color: '#475569', fontSize: 13 },
  profileInfoValue: { color: '#f1f5f9', fontSize: 13, fontWeight: '500', maxWidth: '65%', textAlign: 'right' },
  profileStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#1a2030', borderRadius: 12, borderWidth: 1, borderColor: '#2d3748', marginBottom: 12, overflow: 'hidden' },
  profileStatBox: { width: '33.33%', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#2d3748' },
  profileStatNum: { color: '#38bdf8', fontSize: 22, fontWeight: '700' },
  profileStatLabel: { color: '#475569', fontSize: 11, marginTop: 2 },
  socialLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  socialLink: { backgroundColor: '#1a2030', borderRadius: 8, borderWidth: 1, borderColor: '#2d3748', paddingHorizontal: 14, paddingVertical: 8 },
  socialLinkText: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
});
