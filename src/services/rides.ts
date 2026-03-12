import { api } from './api';

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

export async function getWaypoints(rideId: number): Promise<Waypoint[]> {
  const res = await api.get<{ data: Waypoint[] }>(`/rides/${rideId}/waypoints`);
  return res.data;
}
