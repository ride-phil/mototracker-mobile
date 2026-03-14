import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RideListScreen from './src/screens/RideListScreen';
import RideDetailScreen from './src/screens/RideDetailScreen';
import SubmitVerificationScreen from './src/screens/SubmitVerificationScreen';
import MyProgressScreen from './src/screens/MyProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import EvidenceDetailScreen from './src/screens/EvidenceDetailScreen';
import AppDrawer from './src/components/AppDrawer';
import { getStoredUser, AuthUser } from './src/services/auth';
import { registerPushToken } from './src/services/notifications';
import { ActivityStackParamList, AuthStackParamList, ProfileStackParamList, RidesStackParamList, TabParamList } from './src/types/navigation';

const navigationRef = createNavigationContainerRef<any>();

function handleNotificationTap(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as Record<string, any>;
  const type = data?.type;
  const rideId = data?.ride_id;

  if (!navigationRef.isReady()) return;

  if ((type === 'waypoint_hit' || type === 'verification_accepted' || type === 'verification_rejected') && rideId) {
    navigationRef.navigate('Rides', {
      screen: 'MyProgress',
      params: { ride: { id: rideId } },
    });
  } else if (type === 'ride_launched' && rideId) {
    navigationRef.navigate('Rides', {
      screen: 'RideDetail',
      params: { rideId },
    });
  }
}

const AuthStack      = createNativeStackNavigator<AuthStackParamList>();
const RidesStack     = createNativeStackNavigator<RidesStackParamList>();
const ActivityStack  = createNativeStackNavigator<ActivityStackParamList>();
const ProfileStack   = createNativeStackNavigator<ProfileStackParamList>();
const Tab            = createBottomTabNavigator<TabParamList>();

const stackOpts = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0f1117' },
  animation: 'slide_from_right' as const,
};

function RidesNavigator() {
  return (
    <RidesStack.Navigator screenOptions={stackOpts}>
      <RidesStack.Screen name="RideList" component={RideListScreen} />
      <RidesStack.Screen name="RideDetail" component={RideDetailScreen} />
      <RidesStack.Screen name="SubmitVerification" component={SubmitVerificationScreen} />
      <RidesStack.Screen name="MyProgress" component={MyProgressScreen} />
      <RidesStack.Screen name="EvidenceDetail" component={EvidenceDetailScreen} />
    </RidesStack.Navigator>
  );
}

function ActivityNavigator() {
  return (
    <ActivityStack.Navigator screenOptions={stackOpts}>
      <ActivityStack.Screen name="ActivityList" component={ActivityScreen} />
      <ActivityStack.Screen name="EvidenceDetail" component={EvidenceDetailScreen} />
    </ActivityStack.Navigator>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f1117',
          borderTopColor: '#1a2030',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Rides"
        component={RidesNavigator}
        options={{ tabBarIcon: () => <TabIcon emoji="🏍" /> }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityNavigator}
        options={{ tabBarIcon: () => <TabIcon emoji="📋" /> }}
      />
      <Tab.Screen
        name="GPS"
        component={OnboardingScreen}
        options={{ tabBarIcon: () => <TabIcon emoji="📡" /> }}
      />
      <Tab.Screen
        name="Profile"
        options={{ tabBarIcon: () => <TabIcon emoji="👤" /> }}
      >
        {() => (
          <ProfileStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f1117' }, animation: 'slide_from_right' }}>
            <ProfileStack.Screen name="ProfileMain">
              {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
            </ProfileStack.Screen>
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
          </ProfileStack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      registerPushToken();
    }
  }, [user]);

  useEffect(() => {
    // Handle tap on a notification that arrived while app was foregrounded
    const foregroundSub = Notifications.addNotificationResponseReceivedListener(handleNotificationTap);

    // Handle tap on a notification that launched/resumed the app from background/killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationTap(response);
    });

    return () => foregroundSub.remove();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' }}>
        <ActivityIndicator color="#38bdf8" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  const handleAuthSuccess = () => getStoredUser().then(setUser);

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer ref={navigationRef}>
          <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f1117' } }}>
            <AuthStack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLoginSuccess={handleAuthSuccess} />}
            </AuthStack.Screen>
            <AuthStack.Screen name="Register">
              {(props) => <RegisterScreen {...props} onRegisterSuccess={handleAuthSuccess} />}
            </AuthStack.Screen>
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </AuthStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer ref={navigationRef}>
        <AppDrawer>
          <MainTabs onLogout={() => setUser(null)} />
        </AppDrawer>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
