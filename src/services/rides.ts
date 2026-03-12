import { api } from './api';

export interface Ride {
  id: number;
  name: string;
  description: string | null;
  type: 'rally' | 'explorer';
  status: string;
  start_date: string | null;
  end_date: string | null;
  is_joined: boolean;
}

export async function getRides(): Promise<Ride[]> {
  const res = await api.get<{ data: Ride[] }>('/rides');
  return res.data;
}

export async function joinRide(rideId: number): Promise<void> {
  await api.post(`/rides/${rideId}/join`, {});
}
