import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Mapbox from '@rnmapbox/maps';
import { getVerificationDetail, VerificationDetail } from '../services/verifications';

Mapbox.setAccessToken(Constants.expoConfig?.extra?.mapboxToken ?? '');

type Props = {
  navigation: { goBack: () => void };
  route: { params: { verificationId: number; type: 'photo' | 'gpx' } };
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:      { bg: '#1c1a0a', text: '#fbbf24' },
  accepted:     { bg: '#0a1f0a', text: '#86efac' },
  rejected:     { bg: '#1a0a0a', text: '#fca5a5' },
  needs_review: { bg: '#1a0f0a', text: '#fb923c' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EvidenceDetailScreen({ route, navigation }: Props) {
  const { verificationId, type } = route.params;

  const [detail, setDetail]   = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getVerificationDetail(verificationId)
      .then(setDetail)
      .catch((e: any) => setError(e.message || 'Failed to load evidence.'))
      .finally(() => setLoading(false));
  }, [verificationId]);

  const statusStyle = detail
    ? (STATUS_STYLE[detail.status] ?? { bg: '#1a2030', text: '#94a3b8' })
    : null;

  // Compute map center from first waypoint hit
  const firstHit = detail?.waypoint_hits[0];
  const mapCenter: [number, number] = firstHit
    ? [firstHit.lng, firstHit.lat]
    : [121.0, 14.6]; // PH fallback

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'photo' ? 'Photo Evidence' : 'GPX Evidence'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#38bdf8" size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              getVerificationDetail(verificationId)
                .then(setDetail)
                .catch((e: any) => setError(e.message || 'Failed to load evidence.'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : detail ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Status + metadata */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle!.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle!.text }]}>
                  {detail.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Submitted</Text>
              <Text style={styles.metaValue}>{formatDate(detail.submitted_at)}</Text>
            </View>
            {detail.original_filename ? (
              <>
                <View style={styles.metaDivider} />
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>File</Text>
                  <Text style={styles.metaValue} numberOfLines={2}>{detail.original_filename}</Text>
                </View>
              </>
            ) : null}
            <View style={styles.metaDivider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Verification ID</Text>
              <Text style={styles.metaValue}>#{detail.id}</Text>
            </View>
          </View>

          {/* Photo preview */}
          {detail.type === 'photo' && detail.photo_url ? (
            <View style={styles.photoCard}>
              <Image
                source={{ uri: detail.photo_url }}
                style={styles.photo}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Map */}
          {detail.waypoint_hits.length > 0 || detail.geo_json ? (
            <View style={styles.mapCard}>
              <Text style={styles.sectionTitle}>
                {detail.type === 'gpx' ? 'Route & Waypoints' : 'Waypoint Location'}
              </Text>
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
                    zoomLevel={detail.waypoint_hits.length === 1 ? 11 : 8}
                    animationMode="none"
                  />

                  {/* GPX track */}
                  {detail.type === 'gpx' && detail.geo_json ? (
                    <Mapbox.ShapeSource id="gpxTrack" shape={detail.geo_json as any}>
                      <Mapbox.LineLayer
                        id="gpxLine"
                        style={{ lineColor: '#38bdf8', lineWidth: 3, lineOpacity: 0.9 }}
                      />
                    </Mapbox.ShapeSource>
                  ) : null}

                  {/* Waypoint pins */}
                  {detail.waypoint_hits.map((hit, i) => (
                    <Mapbox.PointAnnotation
                      key={String(hit.waypoint_id) + i}
                      id={'wp' + hit.waypoint_id + i}
                      coordinate={[hit.lng, hit.lat]}
                    >
                      <View style={[
                        styles.markerDot,
                        { backgroundColor: hit.credited ? '#86efac' : '#64748b' },
                      ]} />
                    </Mapbox.PointAnnotation>
                  ))}
                </Mapbox.MapView>
              </View>
            </View>
          ) : null}

          {/* Waypoint hits */}
          <Text style={styles.sectionTitle}>
            Waypoints Matched
            {detail.waypoint_hits.length > 0 ? ` (${detail.waypoint_hits.length})` : ''}
          </Text>

          {detail.waypoint_hits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No waypoints were matched by this evidence.</Text>
              <Text style={styles.emptySubText}>
                Check that you are joined to an active ride and your evidence covers a waypoint location.
              </Text>
            </View>
          ) : (
            <View style={styles.hitList}>
              {detail.waypoint_hits.map((hit, i) => (
                <View key={String(hit.waypoint_id) + i} style={styles.hitRow}>
                  <View style={[
                    styles.creditDot,
                    { backgroundColor: hit.credited ? '#86efac' : '#475569' },
                  ]} />
                  <View style={styles.hitInfo}>
                    <Text style={styles.hitName}>{hit.name}</Text>
                    {hit.hit_at ? (
                      <Text style={styles.hitDate}>{formatDate(hit.hit_at)}</Text>
                    ) : null}
                  </View>
                  <View style={[
                    styles.creditBadge,
                    { backgroundColor: hit.credited ? '#0a1f0a' : '#1a2030' },
                  ]}>
                    <Text style={[
                      styles.creditBadgeText,
                      { color: hit.credited ? '#86efac' : '#64748b' },
                    ]}>
                      {hit.credited ? 'Credited' : 'Prior credit'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      ) : null}
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
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#fca5a5', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#1a2030',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: { color: '#38bdf8', fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 48 },

  // Metadata card
  metaCard: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 16,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metaDivider: { height: 1, backgroundColor: '#2d3748' },
  metaLabel: { color: '#64748b', fontSize: 13 },
  metaValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 12 },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Photo
  photoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1a2030',
  },
  photo: { width: '100%', height: 300 },

  // Map
  mapCard: { marginBottom: 16 },
  mapContainer: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  map: { flex: 1 },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#0f1117',
  },

  // Section
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  // Hits
  hitList: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    overflow: 'hidden',
  },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  creditDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    flexShrink: 0,
  },
  hitInfo: { flex: 1 },
  hitName: { color: '#f1f5f9', fontSize: 14, fontWeight: '500' },
  hitDate: { color: '#64748b', fontSize: 12, marginTop: 2 },
  creditBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  creditBadgeText: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyCard: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  emptySubText: { color: '#475569', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
