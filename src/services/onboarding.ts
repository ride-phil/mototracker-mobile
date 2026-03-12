import { api } from './api';

export interface OnboardingStatus {
  traccar_enabled: boolean;
  server_url: string;
  email: string;
  has_account: boolean;
  password: string | null;
  has_device: boolean;
  device_uid: string | null;
  signal: { status: 'communicating' | 'never' | 'unknown'; last_update: string | null } | null;
  is_ready: boolean;
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await api.get<{ data: OnboardingStatus }>('/onboarding/status');
  return res.data;
}

export async function createGpsAccount(): Promise<void> {
  await api.post('/onboarding/account', {});
}

export async function createDevice(): Promise<{ device_uid: string }> {
  const res = await api.post<{ device_uid: string }>('/onboarding/device', {});
  return res;
}
