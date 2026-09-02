import axios from "axios";
import type { TripRequest, TripResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function planTrip(data: TripRequest): Promise<TripResponse> {
  const response = await axios.post<TripResponse>(
    `${API_BASE}/api/trip/`,
    data
  );
  return response.data;
}
