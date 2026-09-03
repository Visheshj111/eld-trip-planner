import math
from dataclasses import dataclass, field

@dataclass
class Event:
    start_minutes: int
    end_minutes: int
    status: str
    location: str
    note: str
    is_continuation: bool = False
    mile: float = 0.0

@dataclass
class DailyLog:
    day: int
    date_label: str
    total_miles: float
    events: list
    totals: dict = field(default_factory=dict)

DRIVING_LIMIT_MIN = 11 * 60
WINDOW_LIMIT_MIN = 14 * 60
BREAK_TRIGGER_MIN = 8 * 60
BREAK_DURATION_MIN = 30
REST_DURATION_MIN = 10 * 60
CYCLE_LIMIT_MIN = 70 * 60
RESTART_DURATION_MIN = 34 * 60
FUEL_INTERVAL_MILES = 1000.0
FUEL_STOP_DURATION_MIN = 30
DAY_MINUTES = 24 * 60
DEFAULT_START_HOUR = 6



class HOSState:
    def __init__(self, start_time, current_cycle_used):
        self.current_time = start_time
        self.cycle_used = int(math.ceil(current_cycle_used * 60))
        self.drive_in_window = 0
        self.window_start = -1
        self.drive_since_break = 0
        self.non_driving_streak = 0
        self.events = []

    def add_event(self, status, duration, loc, note, mile=0.0):
        self.events.append(Event(self.current_time, self.current_time + duration, status, loc, note, mile=mile))
        
        if status in ("on_duty", "driving"):
            self.cycle_used += duration
            if self.window_start < 0:
                self.window_start = self.current_time

        if status == "driving":
            self.drive_in_window += duration
            self.drive_since_break += duration
            self.non_driving_streak = 0
        else:
            self.non_driving_streak += duration
            if self.non_driving_streak >= 30:
                self.drive_since_break = 0
                
            if note in ("10-hour rest", "34-hour restart"):
                self.drive_in_window = 0
                self.window_start = -1
            if note == "34-hour restart":
                self.cycle_used = 0
                
        self.current_time += duration

def plan_trip(distance_miles, duration_hours, current_cycle_used, pickup_location, dropoff_location, pickup_mileage=0.0, start_hour=DEFAULT_START_HOUR):
    avg_speed = distance_miles / duration_hours if duration_hours > 0 else 55.0
    if avg_speed <= 0:
        avg_speed = 55.0

    state = HOSState(start_hour * 60, current_cycle_used)
    map_stops = []
    miles_covered = 0.0

    def add_event(status, duration, loc, note, mile=0.0):
        state.add_event(status, duration, loc, note, mile=mile)

    def schedule_atomic_on_duty(duration, loc, note, stop_type, mile, label):
        if CYCLE_LIMIT_MIN - state.cycle_used < duration:
            add_event("off_duty", RESTART_DURATION_MIN, "", "34-hour restart", mile=mile)
            map_stops.append({"type": "rest", "mile": round(mile, 1), "label": "34-hour restart"})
            
        if state.window_start < 0:
            state.window_start = state.current_time
            
        window_elapsed = state.current_time - state.window_start
        if WINDOW_LIMIT_MIN - window_elapsed < duration:
            add_event("sleeper_berth", 8 * 60, "", "10-hour rest", mile=mile)
            add_event("off_duty", 2 * 60, "", "", mile=mile)
            map_stops.append({"type": "rest", "mile": round(mile, 1), "label": "10-hour rest"})
            
        add_event("on_duty", duration, loc, note, mile=mile)
        map_stops.append({"type": stop_type, "mile": round(mile, 1), "label": label})

    next_pickup_target = pickup_mileage
    pickup_completed = False
    if next_pickup_target <= 0.01:
        schedule_atomic_on_duty(60, pickup_location, "Pickup", "pickup", 0.0, f"Pickup - {pickup_location}")
        pickup_completed = True

    next_fuel_target = FUEL_INTERVAL_MILES
    remaining_miles = distance_miles

    while remaining_miles > 0.01:
        if state.window_start < 0:
            state.window_start = state.current_time

        window_elapsed = state.current_time - state.window_start
        time_left_in_window = max(0, WINDOW_LIMIT_MIN - window_elapsed)
        drive_left_in_window = max(0, DRIVING_LIMIT_MIN - state.drive_in_window)
        time_to_break = max(0, BREAK_TRIGGER_MIN - state.drive_since_break)
        cycle_drive_left = max(0, CYCLE_LIMIT_MIN - state.cycle_used)

        if cycle_drive_left <= 0:
            add_event("off_duty", RESTART_DURATION_MIN, "", "34-hour restart", mile=miles_covered)
            map_stops.append({"type": "rest", "mile": round(miles_covered, 1), "label": "34-hour restart"})
            continue

        if drive_left_in_window <= 0 or time_left_in_window <= 0:
            add_event("sleeper_berth", 8 * 60, "", "10-hour rest", mile=miles_covered)
            add_event("off_duty", 2 * 60, "", "10-hour rest", mile=miles_covered)
            map_stops.append({"type": "rest", "mile": round(miles_covered, 1), "label": "10-hour rest"})
            continue

        if time_to_break <= 0:
            add_event("off_duty", BREAK_DURATION_MIN, "", "30-minute break", mile=miles_covered)
            map_stops.append({"type": "rest", "mile": round(miles_covered, 1), "label": "30-minute break"})
            continue

        miles_to_next_fuel = next_fuel_target - miles_covered
        miles_to_next_pickup = (next_pickup_target - miles_covered) if not pickup_completed else float('inf')
        
        driveable_minutes = min(
            (remaining_miles / avg_speed) * 60,
            (miles_to_next_fuel / avg_speed) * 60 if miles_to_next_fuel > 0 else float('inf'),
            (miles_to_next_pickup / avg_speed) * 60 if miles_to_next_pickup > 0 else float('inf'),
            drive_left_in_window,
            time_left_in_window,
            time_to_break,
            cycle_drive_left
        )
        
        driveable_minutes_int = int(math.floor(driveable_minutes))
        if driveable_minutes_int == 0 and driveable_minutes > 0:
            driveable_minutes_int = 1
            
        if driveable_minutes_int > 0:
            drive_miles = (driveable_minutes_int / 60) * avg_speed
            
            if drive_miles > remaining_miles:
                drive_miles = remaining_miles
                
            add_event("driving", driveable_minutes_int, "", "")
            miles_covered += drive_miles
            remaining_miles -= drive_miles
                
        if not pickup_completed and miles_covered >= next_pickup_target - 0.1:
            schedule_atomic_on_duty(60, pickup_location, "Pickup", "pickup", next_pickup_target, f"Pickup - {pickup_location}")
            pickup_completed = True
            
        if miles_covered >= next_fuel_target - 0.1 and next_fuel_target <= distance_miles:
            schedule_atomic_on_duty(FUEL_STOP_DURATION_MIN, "", "Fuel stop", "fuel", next_fuel_target, "Fuel stop")
            next_fuel_target += FUEL_INTERVAL_MILES

    schedule_atomic_on_duty(60, dropoff_location, "Dropoff", "dropoff", distance_miles, f"Dropoff - {dropoff_location}")

    daily_logs = _split_into_daily_logs(state.events, distance_miles, avg_speed)
    return daily_logs, map_stops


def _split_into_daily_logs(events, total_distance, avg_speed):
    if not events:
        return []

    first_start = events[0].start_minutes
    first_day_offset = int(first_start // DAY_MINUTES) * DAY_MINUTES

    last_end = max(e.end_minutes for e in events)
    num_days = int((last_end - 1 - first_day_offset) // DAY_MINUTES) + 1

    daily_logs = []

    for day_idx in range(num_days):
        day_start = first_day_offset + day_idx * DAY_MINUTES
        day_end = day_start + DAY_MINUTES

        day_events = []
        day_drive_minutes = 0

        for event in events:
            if event.end_minutes <= day_start or event.start_minutes >= day_end:
                continue

            clipped_start = max(event.start_minutes, day_start)
            clipped_end = min(event.end_minutes, day_end)

            if clipped_end - clipped_start <= 0:
                continue

            day_events.append(Event(
                start_minutes=clipped_start - day_start,
                end_minutes=clipped_end - day_start,
                status=event.status,
                location=event.location,
                note=event.note,
                is_continuation=(clipped_start > event.start_minutes),
                mile=event.mile
            ))

            if event.status == "driving":
                day_drive_minutes += (clipped_end - clipped_start)

        day_events = _fill_gaps_with_off_duty(day_events)
        totals = _compute_totals(day_events)
        day_miles = round((day_drive_minutes / 60) * avg_speed, 1)

        daily_logs.append(DailyLog(
            day=day_idx + 1,
            date_label=f"Day {day_idx + 1}",
            total_miles=day_miles,
            events=day_events,
            totals=totals,
        ))

    return daily_logs


def _fill_gaps_with_off_duty(events):
    if not events:
        return [Event(
            start_minutes=0,
            end_minutes=DAY_MINUTES,
            status="off_duty",
            location="",
            note="",
        )]

    events.sort(key=lambda e: e.start_minutes)
    filled = []

    if events[0].start_minutes > 0:
        filled.append(Event(
            start_minutes=0,
            end_minutes=events[0].start_minutes,
            status="off_duty",
            location="",
            note="",
        ))

    for i, event in enumerate(events):
        filled.append(event)
        if i < len(events) - 1:
            gap_start = event.end_minutes
            gap_end = events[i + 1].start_minutes
            if gap_end - gap_start > 0:
                filled.append(Event(
                    start_minutes=gap_start,
                    end_minutes=gap_end,
                    status="off_duty",
                    location="",
                    note="",
                ))

    last = events[-1]
    if last.end_minutes < DAY_MINUTES:
        filled.append(Event(
            start_minutes=last.end_minutes,
            end_minutes=DAY_MINUTES,
            status="off_duty",
            location="",
            note="",
        ))

    return filled


def _compute_totals(events):
    totals = {
        "off_duty": 0.0,
        "sleeper_berth": 0.0,
        "driving": 0.0,
        "on_duty": 0.0,
    }

    for event in events:
        duration_hours = (event.end_minutes - event.start_minutes) / 60.0
        if event.status in totals:
            totals[event.status] += duration_hours

    for key in totals:
        totals[key] = round(totals[key], 2)

    return totals
