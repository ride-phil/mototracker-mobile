import { Ride } from '../services/rides';

// Bottom tab param list
export type TabParamList = {
  Rides: undefined;
  Activity: undefined;
  GPS: undefined;
  Profile: undefined;
};

// Rides stack (nested inside Rides tab)
export type RidesStackParamList = {
  RideList: undefined;
  RideDetail: { ride: Ride };
  SubmitVerification: { ride: Ride };
  MyProgress: { ride: Ride };
  RideDiagnostics: { rideId: number };
  EvidenceDetail: { verificationId: number; type: 'photo' | 'gpx' };
};

// Activity stack (nested inside Activity tab)
export type ActivityStackParamList = {
  ActivityList: undefined;
  EvidenceDetail: { verificationId: number; type: 'photo' | 'gpx' };
};

// Profile stack (nested inside Profile tab)
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

// Auth stack (outside tabs)
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Root stack (wraps tabs + drawer-accessible screens)
export type RootStackParamList = {
  Main: undefined;
  Leaderboard: undefined;
  About: undefined;
};
