import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const BASE_URL = 'https://app.mototracker.app/api/v1';

export interface VerificationResult {
  verification_id: number | null;
  matched_waypoints: number;
  new_hits: number;
}

export interface WaypointHitDetail {
  waypoint_id: number;
  name: string;
  lat: number;
  lng: number;
  radius_meters: number;
  hit_at: string | null;
  verification_method: string | null;
  credited: boolean;
}

export interface VerificationDetail {
  id: number;
  type: 'photo' | 'gpx';
  status: string;
  submitted_at: string | null;
  original_filename: string | null;
  photo_url: string | null;
  geo_json: object | null;
  waypoint_hits: WaypointHitDetail[];
}

export async function getVerificationDetail(id: number): Promise<VerificationDetail> {
  const res = await api.get<{ data: VerificationDetail }>(`/verifications/${id}`);
  return res.data;
}

export async function submitVerification(
  type: 'photo' | 'gpx',
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<VerificationResult> {
  const token = await AsyncStorage.getItem('auth_token');

  const form = new FormData();
  form.append('type', type);
  form.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const res = await fetch(`${BASE_URL}/verifications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      // Do NOT set Content-Type — fetch sets it automatically with boundary for FormData
    },
    body: form,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Submission failed');
  }

  return json.data;
}
