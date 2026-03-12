import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://app.mototracker.app/api/v1';

export interface VerificationResult {
  verification_id: number;
  status: string;
  hit_id: number | null;
  reason: string;
}

export async function submitVerification(
  rideId: number,
  waypointId: number,
  type: 'photo' | 'gpx',
  fileUri: string,
  fileName: string,
  mimeType: string
): Promise<VerificationResult> {
  const token = await AsyncStorage.getItem('auth_token');

  const form = new FormData();
  form.append('ride_id', String(rideId));
  form.append('waypoint_id', String(waypointId));
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
