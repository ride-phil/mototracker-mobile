import { api } from './api';

export interface FullProfile {
  id: number;
  name: string;
  username: string | null;
  email: string;
  role: string;
  location: string | null;
  bike: string | null;
  riding_style: string | null;
  riding_club: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export interface ProfileData {
  name?: string;
  username?: string | null;
  location?: string | null;
  bike?: string | null;
  riding_style?: string | null;
  riding_club?: string | null;
  bio?: string | null;
}

export async function getFullProfile(): Promise<FullProfile> {
  const res = await api.get<{ data: FullProfile }>('/auth/me');
  return res.data;
}

export async function updateProfile(data: ProfileData): Promise<FullProfile> {
  const res = await api.put<{ data: FullProfile }>('/profile', data);
  return res.data;
}

export async function uploadAvatar(imageUri: string): Promise<string> {
  const token = await import('@react-native-async-storage/async-storage')
    .then(m => m.default.getItem('auth_token'));

  const formData = new FormData();
  const filename = imageUri.split('/').pop() ?? 'avatar.jpg';
  const match    = /\.(\w+)$/.exec(filename);
  const type     = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('avatar', { uri: imageUri, name: filename, type } as any);

  const res = await fetch('https://app.mototracker.app/api/v1/profile/avatar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    const err: any = new Error(json.message || 'Avatar upload failed');
    err.errors = json.errors;
    throw err;
  }

  return json.data.avatar_url;
}

export async function updatePassword(
  current_password: string,
  password: string,
  password_confirmation: string
): Promise<void> {
  await api.put('/profile/password', { current_password, password, password_confirmation });
}
