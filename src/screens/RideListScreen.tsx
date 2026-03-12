import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getRides, joinRide, Ride } from '../services/rides';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RideList'>;

export default function RideListScreen({ navigation }: Props) {
  const [rides, setRides]       = useState<Ride[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [joining, setJoining]   = useState<number | null>(null);

  const fetchRides = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getRides();
      setRides(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load rides.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  async function handleJoin(ride: Ride) {
    setJoining(ride.id);
    try {
      await joinRide(ride.id);
      setRides(prev =>
        prev.map(r => r.id === ride.id ? { ...r, is_joined: true } : r)
      );
    } catch (e: any) {
      // already joined or other error — just refresh
      fetchRides();
    } finally {
      setJoining(null);
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchRides()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rides</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={rides}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={rides.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRides(true)}
            tintColor="#38bdf8"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No active rides available.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RideDetail', { ride: item })}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.rideName}>{item.name}</Text>
              <View style={[styles.badge, item.type === 'rally' ? styles.badgeRally : styles.badgeExplorer]}>
                <Text style={styles.badgeText}>{item.type}</Text>
              </View>
            </View>

            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.dates}>
              <Text style={styles.dateText}>
                {formatDate(item.start_date)} — {formatDate(item.end_date)}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              {item.is_joined ? (
                <View style={styles.joinedBadge}>
                  <Text style={styles.joinedText}>Joined</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleJoin(item)}
                  disabled={joining === item.id}
                >
                  {joining === item.id
                    ? <ActivityIndicator color="#0f1117" size="small" />
                    : <Text style={styles.joinButtonText}>Join Ride</Text>
                  }
                </TouchableOpacity>
              )}
              <Text style={styles.detailsLink}>View details →</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  headerTitle: {
    color: '#f1f5f9',
    fontSize: 28,
    fontWeight: '700',
  },
  profileButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  profileButtonText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rideName: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeRally: {
    backgroundColor: '#1e3a5f',
  },
  badgeExplorer: {
    backgroundColor: '#1a3a2a',
  },
  badgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  dates: {
    marginBottom: 12,
  },
  dateText: {
    color: '#475569',
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#0f1117',
    fontWeight: '700',
    fontSize: 14,
  },
  joinedBadge: {
    backgroundColor: '#14532d',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#166534',
  },
  joinedText: {
    color: '#86efac',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsLink: {
    color: '#38bdf8',
    fontSize: 13,
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
  retryText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  emptyText: {
    color: '#475569',
    fontSize: 15,
    textAlign: 'center',
  },
});
