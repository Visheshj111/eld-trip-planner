from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view

from .serializers import TripRequestSerializer
from .geocoding import geocode, get_route, interpolate_point_on_route, reverse_geocode
from .hos_engine import plan_trip, FUEL_INTERVAL_MILES


class TripView(APIView):

    def post(self, request):
        serializer = TripRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            current_coords = geocode(data["current_location"])
            pickup_coords = geocode(data["pickup_location"])
            dropoff_coords = geocode(data["dropoff_location"])
        except Exception as e:
            return Response(
                {"error": f"Geocoding failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            route_data = get_route([current_coords, pickup_coords, dropoff_coords])
        except Exception as e:
            return Response(
                {"error": f"Route calculation failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        distance_miles = route_data["distance_miles"]
        duration_hours = route_data["duration_hours"]
        geometry = route_data["geometry"]
        pickup_mileage = 0.0
        if "segments" in route_data and len(route_data["segments"]) > 0:
            pickup_mileage = round(route_data["segments"][0].get("distance", 0) * 0.000621371, 1)

        daily_logs, map_stops = plan_trip(
            distance_miles=distance_miles,
            duration_hours=duration_hours,
            current_cycle_used=data["current_cycle_used"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            pickup_mileage=pickup_mileage,
        )

        all_stops = []
        for stop in map_stops:
            point = interpolate_point_on_route(geometry, distance_miles, stop["mile"])
            all_stops.append({
                "location": point,
                "label": stop["label"],
                "mile": stop["mile"],
                "type": stop["type"],
            })
        for log in daily_logs:
            for e in log.events:
                if not e.location and e.note in ("10-hour rest", "34-hour restart", "30-minute break"):
                    try:
                        point = interpolate_point_on_route(geometry, distance_miles, getattr(e, "mile", 0.0))
                        loc_str = reverse_geocode(point[0], point[1])
                        if loc_str:
                            e.location = loc_str
                    except Exception as err:
                        print(f"Error reverse geocoding event at mile {getattr(e, 'mile', 0.0)}: {err}")

        response_data = {
            "route": {
                "geometry": geometry,
                "distance_miles": distance_miles,
                "duration_hours": duration_hours,
                "stops": all_stops,
            },
            "daily_logs": [
                {
                    "day": log.day,
                    "date_label": log.date_label,
                    "total_miles": log.total_miles,
                    "events": [
                        {
                            "start": _minutes_to_hhmm(e.start_minutes),
                            "end": _minutes_to_hhmm(e.end_minutes),
                            "status": e.status,
                            "location": e.location,
                            "note": e.note,
                            "is_continuation": getattr(e, "is_continuation", False),
                        }
                        for e in log.events
                    ],
                    "totals": log.totals,
                }
                for log in daily_logs
            ],
        }

        return Response(response_data, status=status.HTTP_200_OK)

def _minutes_to_hhmm(minutes):
    minutes = int(minutes) % (24 * 60)
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}"

@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok"}, status=status.HTTP_200_OK)

