import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import RideListScreen from './src/screens/RideListScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';
import SubmitVerificationScreen from './src/screens/SubmitVerificationScreen';
import MyProgressScreen from './src/screens/MyProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { getStoredUser, AuthUser } from './src/services/auth';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      <SafeAreaProvider>
        <LoginScreen onLoginSuccess={() => getStoredUser().then(setUser)} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f1117' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="RideList" component={RideListScreen} />
          <Stack.Screen name="RideDetail" component={RideDetailScreen} />
          <Stack.Screen name="SubmitVerification" component={SubmitVerificationScreen} />
          <Stack.Screen name="MyProgress" component={MyProgressScreen} />
          <Stack.Screen name="Profile">
            {(props) => <ProfileScreen {...props} onLogout={() => setUser(null)} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
