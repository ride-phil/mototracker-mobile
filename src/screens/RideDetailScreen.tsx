import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Mapbox from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { Waypoint, getWaypoints, joinRide } from '../services/rides';
import { RootStackParamList } from '../types/navigation';

Mapbox.setAccessToken(Constants.expoConfig?.extra?.mapboxToken ?? '');

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 280;

type Props = NativeStackScreenProps<RootStackParamList, 'RideDetail'>;

export default function RideDetailScreen({ route, navigation }: Props) {
  const ride = route.params.ride;
  const [waypoints, setWaypoints]   = useState<Waypoint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [joining, setJoining]       = useState(false);
  const [isJoined, setIsJoined]     = useState(ride.is_joined);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    getWaypoints(ride.id)
      .then(setWaypoints)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ride.id]);

  async function handleJoin() {
    setJoining(true);
    try {
      await joinRide(ride.id);
      setIsJoined(true);
    } catch (e: any) {
      setError(e.message || 'Failed to join ride.');
    } finally {
      setJoining(false);
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  // Compute map center from waypoints
  const mapCenter = waypoints.length > 0
    ? [
        waypoints.reduce((s, w) => s + w.longitude, 0) / waypoints.length,
        waypoints.reduce((s, w) => s + w.latitude, 0) / waypoints.length,
      ]
    : [-95, 38]; // fallback: center of US

  const waypointGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: waypoints.map(wp => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [wp.longitude, wp.latitude] },
      properties: { id: wp.id, name: wp.name, radius: wp.radius_meters },
    })),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Rides</Text>
        </TouchableOpacity>
        <View style={[styles.typeBadge, ride.type === 'rally' ? styles.badgeRally : styles.badgeExplorer]}>
          <Text style={styles.typeBadgeText}>{ride.type}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Ride title */}
        <View style={styles.titleSection}>
          <Text style={styles.rideName}>{ride.name}</Text>
          <Text style={styles.dates}>
            {formatDate(ride.start_date)} — {formatDate(ride.end_date)}
          </Text>
          {ride.description ? (
            <Text style={styles.description}>{ride.description}</Text>
          ) : null}
        </View>

        {/* Join button */}
        {!isJoined ? (
          <TouchableOpacity
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining
              ? <ActivityIndicator color="#0f1117" />
              : <Text style={styles.joinButtonText}>Join This Ride</Text>
            }
          </TouchableOpacity>
        ) : (
          <View style={styles.joinedBanner}>
            <Text style={styles.joinedText}>You're registered for this ride</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Waypoints Map */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Waypoints</Text>
          {!loading && <Text style={styles.waypointCount}>{waypoints.length} locations</Text>}
        </View>

        {loading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator color="#38bdf8" />
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <Mapbox.MapView
              style={styles.map}
              styleURL="mapbox://styles/mapbox/dark-v11"
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
              <View key={wp.id} style={styles.waypointRow}>
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
                <Text style={styles.waypointRadius}>{wp.radius_meters}m</Text>
              </View>
            ))}
          </View>
        )}

        {!loading && waypoints.length === 0 && (
          <Text style={styles.emptyText}>No waypoints configured for this ride.</Text>
        )}

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
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 16,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeRally: { backgroundColor: '#1e3a5f' },
  badgeExplorer: { backgroundColor: '#1a3a2a' },
  typeBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    padding: 20,
  },
  rideName: {
    color: '#f1f5f9',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  dates: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 10,
  },
  description: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
  },
  joinButton: {
    backgroundColor: '#38bdf8',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#0f1117',
    fontSize: 16,
    fontWeight: '700',
  },
  joinedBanner: {
    backgroundColor: '#14532d',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#166534',
  },
  joinedText: {
    color: '#86efac',
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#450a0a',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
  },
  waypointCount: {
    color: '#475569',
    fontSize: 13,
  },
  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 16,
  },
  map: {
    height: MAP_HEIGHT,
    width: '100%',
  },
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
    borderColor: '#0f1117',
  },
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
  waypointNumberText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  waypointInfo: {
    flex: 1,
  },
  waypointName: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '600',
  },
  waypointDesc: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  waypointGroup: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
  },
  waypointRadius: {
    color: '#475569',
    fontSize: 12,
    marginLeft: 8,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
