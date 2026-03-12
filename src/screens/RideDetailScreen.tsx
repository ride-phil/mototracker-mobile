import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Mapbox from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { Waypoint, getWaypoints, joinRide, leaveRide, downloadAndShareGpx } from '../services/rides';
import { RootStackParamList } from '../types/navigation';

Mapbox.setAccessToken(Constants.expoConfig?.extra?.mapboxToken ?? '');

const MAP_HEIGHT = 260;

type Props = NativeStackScreenProps<RootStackParamList, 'RideDetail'>;

export default function RideDetailScreen({ route, navigation }: Props) {
  const initialRide = route.params.ride;
  const [waypoints, setWaypoints]   = useState<Waypoint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isJoined, setIsJoined]     = useState(initialRide.is_joined);
  const [joining, setJoining]       = useState(false);
  const [leaving, setLeaving]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Live progress numbers (may have updated since list was fetched)
  const hitCount       = initialRide.hit_count;
  const totalWaypoints = initialRide.total_waypoints;
  const completionPct  = initialRide.completion_pct;

  useEffect(() => {
    getWaypoints(initialRide.id)
      .then(setWaypoints)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialRide.id]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      await joinRide(initialRide.id);
      setIsJoined(true);
    } catch (e: any) {
      setError(e.message || 'Failed to join ride.');
    } finally {
      setJoining(false);
    }
  }

  function confirmLeave() {
    Alert.alert(
      'Leave Ride',
      `Are you sure you want to leave "${initialRide.name}"? Your progress will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: doLeave },
      ]
    );
  }

  async function doLeave() {
    setLeaving(true);
    setError(null);
    try {
      await leaveRide(initialRide.id);
      setIsJoined(false);
    } catch (e: any) {
      setError(e.message || 'Failed to leave ride.');
    } finally {
      setLeaving(false);
    }
  }

  async function handleDownloadGpx() {
    setDownloading(true);
    setError(null);
    try {
      await downloadAndShareGpx(initialRide.id, initialRide.name);
    } catch (e: any) {
      setError(e.message || 'Failed to download GPX.');
    } finally {
      setDownloading(false);
    }
  }

  function openDirections(wp: Waypoint) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${wp.latitude},${wp.longitude}`;
    Linking.openURL(url).catch(() => setError('Could not open maps app.'));
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  const mapCenter = waypoints.length > 0
    ? [
        waypoints.reduce((s, w) => s + w.longitude, 0) / waypoints.length,
        waypoints.reduce((s, w) => s + w.latitude, 0) / waypoints.length,
      ]
    : [-95, 38];

  const waypointGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: waypoints.map(wp => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [wp.longitude, wp.latitude] },
      properties: { id: wp.id, name: wp.name },
    })),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Rides</Text>
        </TouchableOpacity>
        <View style={[styles.typeBadge, initialRide.type === 'rally' ? styles.badgeRally : styles.badgeExplorer]}>
          <Text style={styles.typeBadgeText}>{initialRide.type}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Featured image */}
        {initialRide.featured_image ? (
          <Image
            source={{ uri: initialRide.featured_image }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Title + description */}
        <View style={styles.titleSection}>
          <Text style={styles.rideName}>{initialRide.name}</Text>
          {initialRide.location ? (
            <Text style={styles.locationText}>📍 {initialRide.location}</Text>
          ) : null}
          {initialRide.description ? (
            <Text style={styles.description}>{initialRide.description}</Text>
          ) : null}
        </View>

        {/* Schedule card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>START</Text>
              <Text style={styles.scheduleValue}>{formatDate(initialRide.start_date)}</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>END</Text>
              <Text style={styles.scheduleValue}>{formatDate(initialRide.end_date)}</Text>
            </View>
          </View>
        </View>

        {/* Progress card — only when joined and there are waypoints */}
        {isJoined && totalWaypoints > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{hitCount}</Text>
                <Text style={styles.statLabel}>Hits</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalWaypoints}</Text>
                <Text style={styles.statLabel}>Waypoints</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statPct]}>{completionPct}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Join / Leave */}
        {!isJoined ? (
          <TouchableOpacity
            style={[styles.joinButton, joining && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining
              ? <ActivityIndicator color="#0f1117" />
              : <Text style={styles.joinButtonText}>Join This Ride</Text>
            }
          </TouchableOpacity>
        ) : (
          <View style={styles.joinedRow}>
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedText}>Joined</Text>
            </View>
            <TouchableOpacity
              style={[styles.leaveButton, leaving && styles.buttonDisabled]}
              onPress={confirmLeave}
              disabled={leaving}
            >
              {leaving
                ? <ActivityIndicator color="#fca5a5" size="small" />
                : <Text style={styles.leaveButtonText}>Leave Ride</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Waypoints section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Waypoints</Text>
          <View style={styles.sectionActions}>
            {!loading && waypoints.length > 0 && (
              <TouchableOpacity
                style={[styles.gpxButton, downloading && styles.buttonDisabled]}
                onPress={handleDownloadGpx}
                disabled={downloading}
              >
                {downloading
                  ? <ActivityIndicator color="#38bdf8" size="small" />
                  : <Text style={styles.gpxButtonText}>⬇ GPX</Text>
                }
              </TouchableOpacity>
            )}
            {!loading && (
              <Text style={styles.waypointCount}>{waypoints.length} locations</Text>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator color="#38bdf8" />
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <Mapbox.MapView
              style={styles.map}
              styleURL="mapbox://styles/mapbox/streets-v12"
              logoEnabled={false}
              attributionEnabled={false}
              scaleBarEnabled={false}
            >
              <Mapbox.Camera
                centerCoordinate={mapCenter}
                zoomLevel={waypoints.length === 1 ? 10 : 6}
                animationMode="none"
              />
              {waypoints.map(wp => (
                <Mapbox.PointAnnotation
                  key={String(wp.id)}
                  id={String(wp.id)}
                  coordinate={[wp.longitude, wp.latitude]}
                >
                  <View style={styles.markerDot} />
                </Mapbox.PointAnnotation>
              ))}
            </Mapbox.MapView>
          </View>
        )}

        {/* Waypoint list */}
        {!loading && waypoints.length > 0 && (
          <View style={styles.waypointList}>
            {waypoints.map((wp, index) => (
              <View key={wp.id} style={[
                styles.waypointRow,
                index === waypoints.length - 1 && styles.waypointRowLast,
              ]}>
                <View style={styles.waypointNumber}>
                  <Text style={styles.waypointNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.waypointInfo}>
                  <Text style={styles.waypointName}>{wp.name}</Text>
                  {wp.description ? (
                    <Text style={styles.waypointDesc}>{wp.description}</Text>
                  ) : null}
                  <Text style={styles.waypointGroup}>{wp.group_name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => openDirections(wp)}
                >
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!loading && waypoints.length === 0 && (
          <Text style={styles.emptyText}>No waypoints configured for this ride.</Text>
        )}

        {/* Action buttons — when joined */}
        {isJoined && !loading && waypoints.length > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => navigation.navigate('SubmitVerification', { ride: initialRide, waypoints })}
            >
              <Text style={styles.submitButtonText}>Submit Evidence</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.progressButton}
              onPress={() => navigation.navigate('MyProgress', { ride: initialRide })}
            >
              <Text style={styles.progressButtonText}>My Progress</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },

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
  typeBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeRally: { backgroundColor: '#1e3a5f' },
  badgeExplorer: { backgroundColor: '#1a3a2a' },
  typeBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  scrollContent: { paddingBottom: 40 },

  featuredImage: { width: '100%', height: 200 },

  titleSection: { padding: 20, paddingBottom: 12 },
  rideName: { color: '#f1f5f9', fontSize: 26, fontWeight: '700', marginBottom: 6 },
  locationText: { color: '#64748b', fontSize: 14, marginBottom: 8 },
  description: { color: '#94a3b8', fontSize: 15, lineHeight: 22 },

  // Schedule
  scheduleCard: {
    marginHorizontal: 16,
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 16,
    marginBottom: 12,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center' },
  scheduleItem: { flex: 1, alignItems: 'center' },
  scheduleLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scheduleValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  scheduleDivider: { width: 1, height: 36, backgroundColor: '#2d3748', marginHorizontal: 16 },

  // Progress
  progressCard: {
    marginHorizontal: 16,
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 16,
    marginBottom: 12,
  },
  progressStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#f1f5f9', fontSize: 24, fontWeight: '700' },
  statPct: { color: '#38bdf8' },
  statLabel: { color: '#475569', fontSize: 12, marginTop: 2 },
  progressTrack: {
    height: 6,
    backgroundColor: '#2d3748',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },

  errorBox: {
    backgroundColor: '#450a0a',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorText: { color: '#fca5a5', fontSize: 14 },

  // Join / Leave
  joinButton: {
    backgroundColor: '#38bdf8',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  joinButtonText: { color: '#0f1117', fontSize: 16, fontWeight: '700' },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  joinedBadge: {
    flex: 1,
    backgroundColor: '#14532d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#166534',
  },
  joinedText: { color: '#86efac', fontSize: 15, fontWeight: '600' },
  leaveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    alignItems: 'center',
  },
  leaveButtonText: { color: '#fca5a5', fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gpxButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  gpxButtonText: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
  waypointCount: { color: '#475569', fontSize: 13 },

  // Map
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 16,
  },
  map: { height: MAP_HEIGHT, width: '100%' },
  mapPlaceholder: {
    height: MAP_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a2030',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Waypoint list
  waypointList: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a2030',
    borderWidth: 1,
    borderColor: '#2d3748',
    overflow: 'hidden',
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  waypointRowLast: { borderBottomWidth: 0 },
  waypointNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f1117',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  waypointNumberText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },
  waypointInfo: { flex: 1 },
  waypointName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  waypointDesc: { color: '#64748b', fontSize: 13, marginTop: 2 },
  waypointGroup: { color: '#475569', fontSize: 12, marginTop: 2 },
  directionsButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginLeft: 8,
  },
  directionsText: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },

  emptyText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Action buttons
  actionButtons: { marginHorizontal: 16, marginTop: 20, gap: 10 },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: { color: '#0f1117', fontSize: 16, fontWeight: '700' },
  progressButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  progressButtonText: { color: '#38bdf8', fontSize: 16, fontWeight: '600' },
});
