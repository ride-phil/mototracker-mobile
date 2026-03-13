import { api } from './api';

export interface WaypointHit {
  waypoint_id: number;
  waypoint_name: string | null;
  hit_at: string;
  method: string | null;
  source_verification_id: number | null;
}

export interface PendingVerification {
  id: number;
  waypoint_id: number;
  type: string;
  status: string;
  created_at: string;
}

export interface RideProgress {
  hits: WaypointHit[];
  pending: PendingVerification[];
}

export async function getRideProgress(rideId: number): Promise<RideProgress> {
  const res = await api.get<{ data: RideProgress }>(`/rides/${rideId}/progress`);
  return res.data;
}
