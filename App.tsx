import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import { getStoredUser, AuthUser } from './src/services/auth';

export default function App() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' }}>
        <ActivityIndicator color="#38bdf8" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen onLoginSuccess={() => getStoredUser().then(setUser)} />
        <StatusBar style="light" />
      </>
    );
  }

  // Placeholder until we build the Ride List screen
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' }}>
      <ActivityIndicator color="#38bdf8" size="large" />
      <StatusBar style="light" />
    </View>
  );
}
