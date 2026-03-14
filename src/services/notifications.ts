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
  console.log('[Push] registerPushToken started');

  // Ask for permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  console.log('[Push] existing permission status:', existing);
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[Push] requested permission, result:', status);
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] permission not granted, aborting');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MotoTracker',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38bdf8',
    });
  }

  try {
    console.log('[Push] getting Expo push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '6cba8956-3e71-4dbf-bb8e-1a9b4dd8fab9',
    });
    console.log('[Push] token:', tokenData.data);

    await api.post('/notifications/token', { token: tokenData.data });
    console.log('[Push] token registered with backend');
  } catch (e) {
    console.log('[Push] error:', e);
  }
}
