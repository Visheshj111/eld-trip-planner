export interface TripRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
}

export interface RouteStop {
  location: [number, number];
  label: string;
  mile: number;
  type: "pickup" | "dropoff" | "fuel" | "rest";
}

export interface RouteData {
  geometry: [number, number][];
  distance_miles: number;
  duration_hours: number;
  stops: RouteStop[];
}

export interface LogEvent {
  start: string;
  end: string;
  status: "off_duty" | "sleeper_berth" | "driving" | "on_duty";
  location: string;
  note: string;
}

export interface DailyLogTotals {
  off_duty: number;
  sleeper_berth: number;
  driving: number;
  on_duty: number;
}

export interface DailyLog {
  day: number;
  date_label: string;
  total_miles: number;
  events: LogEvent[];
  totals: DailyLogTotals;
}

export interface TripResponse {
  route: RouteData;
  daily_logs: DailyLog[];
}
