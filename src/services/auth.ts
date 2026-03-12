import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export interface AuthUser {
  id: number;
  name: string;
  display_name: string | null;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', { email, password });
  await AsyncStorage.setItem('auth_token', res.token);
  await AsyncStorage.setItem('auth_user', JSON.stringify(res.user));
  return res;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout', {});
  } finally {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  }
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem('auth_user');
  return raw ? JSON.parse(raw) : null;
}
