import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://app.mototracker.app/api/v1';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Request failed');
  }

  return json;
}

export const api = {
  get:    <T>(path: string)              => request<T>('GET',    path),
  post:   <T>(path: string, body: object) => request<T>('POST',   path, body),
  delete: <T>(path: string)              => request<T>('DELETE', path),
};
