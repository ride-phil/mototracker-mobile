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

export interface RiderProfile {
  user_id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  bike: string | null;
  riding_style: string | null;
  riding_club: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  stats: {
    total_rides: number;
    waypoint_credits: number;
    gps_credits: number;
    accepted_photo_submissions: number;
    accepted_gpx_submissions: number;
  };
}

export async function getRiderProfile(userId: number): Promise<RiderProfile> {
  const res = await api.get<{ data: RiderProfile }>(`/riders/${userId}`);
  return res.data;
}
