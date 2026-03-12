import { api } from './api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Ride {
  id: number;
  name: string;
  description: string | null;
  type: 'rally' | 'explorer';
  status: string;
  location: string | null;
  featured_image: string | null;
  start_date: string | null;
  end_date: string | null;
  is_joined: boolean;
  total_waypoints: number;
  hit_count: number;
  completion_pct: number;
}

export interface Waypoint {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  group_id: number;
  group_name: string;
}

export async function getRides(): Promise<Ride[]> {
  const res = await api.get<{ data: Ride[] }>('/rides');
  return res.data;
}

export async function joinRide(rideId: number): Promise<void> {
  await api.post(`/rides/${rideId}/join`, {});
}

export async function leaveRide(rideId: number): Promise<void> {
  await api.delete(`/rides/${rideId}/leave`);
}

export async function getWaypoints(rideId: number): Promise<Waypoint[]> {
  const res = await api.get<{ data: Waypoint[] }>(`/rides/${rideId}/waypoints`);
  return res.data;
}

export async function downloadAndShareGpx(rideId: number, rideName: string): Promise<void> {
  const token = await AsyncStorage.getItem('auth_token');
  const BASE_URL = 'https://app.mototracker.app/api/v1';
  const fileUri = FileSystem.documentDirectory + `ride-${rideId}.gpx`;

  const result = await FileSystem.downloadAsync(
    `${BASE_URL}/rides/${rideId}/gpx`,
    fileUri,
    { headers: { Authorization: `Bearer ${token ?? ''}` } }
  );

  if (result.status !== 200) throw new Error('Failed to download GPX');

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');

  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/gpx+xml',
    dialogTitle: `${rideName} waypoints`,
    UTI: 'public.data',
  });
}
