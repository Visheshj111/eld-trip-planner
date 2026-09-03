import json
from hos_engine import plan_trip
distance_miles = 1003.7
duration_hours = 22.75
current_cycle_used = 69.0
pickup_location = "Chicago Freight Hub, IL"
dropoff_location = "Dallas Distribution Center, TX"
pickup_mileage = 32.7

daily_logs, map_stops = plan_trip(
    distance_miles=distance_miles,
    duration_hours=duration_hours,
    current_cycle_used=current_cycle_used,
    pickup_location=pickup_location,
    dropoff_location=dropoff_location,
    pickup_mileage=pickup_mileage,
    start_hour=6
)

print(json.dumps([log.__dict__ for log in daily_logs], default=lambda o: o.__dict__, indent=2))
