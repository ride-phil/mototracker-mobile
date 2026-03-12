import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import RideListScreen from './src/screens/RideListScreen';
import { getStoredUser, AuthUser } from './src/services/auth';
import { Ride } from './src/services/rides';

export default function App() {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [loading, setLoading]   = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

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
      <SafeAreaProvider>
        <LoginScreen onLoginSuccess={() => getStoredUser().then(setUser)} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RideListScreen onSelectRide={(ride) => setSelectedRide(ride)} />
    </SafeAreaProvider>
  );
}
