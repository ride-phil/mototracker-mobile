import { Ride, Waypoint } from '../services/rides';

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
  SubmitVerification: { ride: Ride; waypoints: Waypoint[] };
  MyProgress: { ride: Ride };
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
