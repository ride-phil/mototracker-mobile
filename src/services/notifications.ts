import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

// How foreground notifications are presented
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken(): Promise<void> {
  // Ask for permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return; // User declined — silent fail, don't block the app
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MotoTracker',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38bdf8',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '6cba8956-3e71-4dbf-bb8e-1a9b4dd8fab9',
  });

  // Register with backend
  try {
    await api.post('/notifications/token', { token: tokenData.data });
  } catch {
    // Non-fatal — app works fine without push tokens registered
  }
}
