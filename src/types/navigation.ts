import { Ride } from '../services/rides';

export type RootStackParamList = {
  RideList: undefined;
  RideDetail: { ride: Ride };
};
