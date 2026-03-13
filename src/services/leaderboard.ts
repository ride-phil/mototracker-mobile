import { api } from './api';

export interface LeaderboardRide {
  id: number;
  name: string;
  type: 'rally' | 'explorer';
  status: string;
  featured_image: string | null;
  total_waypoints: number;
  rider_count: number;
  avg_completion_pct: number;
  max_possible_points: number;
}

export interface LeaderboardRider {
  user_id: number;
  name: string;
  avatar_url: string | null;
  riding_club: string | null;
  total_points: number;
  credited_waypoints: number;
  pct: number;
  gps_hits: number;
  gpx_hits: number;
  photo_hits: number;
  last_hit_at: string | null;
  is_me: boolean;
}

export interface RideRankings {
  total_waypoints: number;
  max_possible_points: number;
  riders: LeaderboardRider[];
}

export async function getLeaderboardRides(): Promise<LeaderboardRide[]> {
  const res = await api.get<{ data: LeaderboardRide[] }>('/leaderboard');
  return res.data;
}

export async function getRideRankings(rideId: number): Promise<RideRankings> {
  const res = await api.get<{ data: RideRankings }>(`/leaderboard/${rideId}`);
  return res.data;
}
