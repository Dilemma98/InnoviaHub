export type Timeslot = {
  timeslotId: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  resourceId: number;
};