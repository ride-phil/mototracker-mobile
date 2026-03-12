import { Ride, Waypoint } from '../services/rides';

export type RootStackParamList = {
  RideList: undefined;
  RideDetail: { ride: Ride };
  SubmitVerification: { ride: Ride; waypoints: Waypoint[] };
};
