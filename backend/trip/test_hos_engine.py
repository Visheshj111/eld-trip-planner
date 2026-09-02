import unittest
from trip.hos_engine import plan_trip, DRIVING_LIMIT_MIN, WINDOW_LIMIT_MIN

class TestHOSEngine(unittest.TestCase):
    def test_3_eleven_hour_rule(self):
        result = plan_trip(distance_miles=1500, duration_hours=25.0, current_cycle_used=0, pickup_location="A", dropoff_location="B")
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        driving_in_window = 0
        for e in events:
            if e.note in ("10-hour rest", "34-hour restart"):
                driving_in_window = 0
            if e.status == "driving":
                driving_in_window += (e.end_minutes - e.start_minutes)
                self.assertLessEqual(driving_in_window, 11 * 60 + 1)

    def test_4_fourteen_hour_rule(self):
        result = plan_trip(distance_miles=800, duration_hours=13.0, current_cycle_used=0, pickup_location="A", dropoff_location="B", pickup_mileage=0.0, start_hour=6)
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        window_start = -1
        for e in events:
            if e.status in ("on_duty", "driving") and window_start < 0:
                window_start = e.start_minutes
            if e.note in ("10-hour rest", "34-hour restart"):
                window_start = -1
            
            if e.status == "driving":
                shift_elapsed = e.start_minutes - window_start
                self.assertLess(shift_elapsed, 14 * 60)

    def test_5_thirty_minute_rule(self):
        result = plan_trip(distance_miles=500, duration_hours=9.0, current_cycle_used=0, pickup_location="A", dropoff_location="B", pickup_mileage=300)
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        
        break_events = [e for e in events if e.note == "30-minute break"]

        
        cumulative_driving = 0
        driving_since_break = 0
        window_start = -1
        cumulative_on_duty_cycle = 0
        
        non_driving_streak = 0
        
        print("\n--- 30-MINUTE RULE TIMELINE ---")
        for e in events:
            dur = e.end_minutes - e.start_minutes
            
            if e.status in ("on_duty", "driving"):
                cumulative_on_duty_cycle += dur
                if window_start < 0:
                    window_start = e.start_minutes
                    
            if e.status != "driving":
                non_driving_streak += dur
                if non_driving_streak >= 30:
                    driving_since_break = 0
            else:
                non_driving_streak = 0

            if e.note in ("10-hour rest", "34-hour restart"):
                window_start = -1
            if e.note == "34-hour restart":
                cumulative_on_duty_cycle = 0
            
            elapsed_window = (e.end_minutes - window_start) if window_start >= 0 else 0
            

            if e.status == "driving":
                self.assertLessEqual(driving_since_break, 8 * 60)
                cumulative_driving += dur
                driving_since_break += dur
                
            sh = int(e.start_minutes // 60); sm = int(e.start_minutes % 60)
            eh = int(e.end_minutes // 60); em = int(e.end_minutes % 60)
            print(f"{sh:02d}:{sm:02d}-{eh:02d}:{em:02d} | {e.status.ljust(15)} | {e.note.ljust(20)} | cum_drive={cumulative_driving}, window_elap={elapsed_window}, cum_cycle={cumulative_on_duty_cycle}")
        print("-------------------------------\n")

    def test_6_ten_hour_reset(self):
        result = plan_trip(distance_miles=800, duration_hours=13.0, current_cycle_used=0, pickup_location="A", dropoff_location="B")
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        rest_events = [e for e in events if e.note == "10-hour rest"]
        self.assertGreaterEqual(len(rest_events), 1)
        total_rest_time = sum(e.end_minutes - e.start_minutes for e in rest_events)
        self.assertGreaterEqual(total_rest_time, 10 * 60)

    def test_7_cycle_rule(self):
        cycles = [0, 42.5, 65, 69, 70]
        for c in cycles:
            result = plan_trip(distance_miles=800, duration_hours=13.0, current_cycle_used=c, pickup_location="A", dropoff_location="B")
            logs, _ = result
            events = [e for log in logs for e in log.events]
            restarts = [e for e in events if e.note == "34-hour restart"]
            if c >= 69:
                self.assertGreaterEqual(len(restarts), 1)
            on_duty_sum = sum(e.end_minutes - e.start_minutes for e in events if e.status in ("driving", "on_duty"))
            if not restarts:
                self.assertLessEqual(c * 60 + on_duty_sum, 70 * 60 + 0.1)

    def test_8_fuel_stops(self):
        tests = [
            (500, 0),
            (1200, 1),
            (1000, 1),
            (2100, 2)
        ]
        for dist, expected_fuel in tests:
            _, map_stops = plan_trip(distance_miles=dist, duration_hours=dist/55, current_cycle_used=0, pickup_location="A", dropoff_location="B")
            fuel_stops = [s for s in map_stops if s["type"] == "fuel"]
            self.assertEqual(len(fuel_stops), expected_fuel)
            if expected_fuel > 0:
                self.assertEqual(fuel_stops[0]["mile"], 1000.0)

    def test_9_pickup_dropoff(self):
        _, map_stops = plan_trip(distance_miles=500, duration_hours=9.0, current_cycle_used=0, pickup_location="A", dropoff_location="B", pickup_mileage=150.0)
        pickups = [s for s in map_stops if s["type"] == "pickup"]
        dropoffs = [s for s in map_stops if s["type"] == "dropoff"]
        self.assertEqual(pickups[0]["mile"], 150.0)
        self.assertEqual(dropoffs[0]["mile"], 500.0)

    def test_10_midnight_crossing(self):
        result = plan_trip(distance_miles=1500, duration_hours=25.0, current_cycle_used=0, pickup_location="A", dropoff_location="B")
        daily_logs, _ = result
        for log in daily_logs:
            total_duration = sum((e.end_minutes - e.start_minutes) for e in log.events)
            self.assertAlmostEqual(total_duration, 24 * 60, delta=1)

    def test_11_event_invariants(self):
        result = plan_trip(distance_miles=800, duration_hours=14.0, current_cycle_used=0, pickup_location="A", dropoff_location="B")
        daily_logs, _ = result
        for log in daily_logs:
            day_total = 0
            for e in log.events:
                dur = e.end_minutes - e.start_minutes
                self.assertGreaterEqual(dur, 0)
                day_total += dur
                self.assertLessEqual(e.start_minutes, 24 * 60)
                self.assertLessEqual(e.end_minutes, 24 * 60)
            self.assertEqual(day_total, 24 * 60)
            calculated_totals = {"off_duty": 0, "sleeper_berth": 0, "driving": 0, "on_duty": 0}
            for e in log.events:
                calculated_totals[e.status] += (e.end_minutes - e.start_minutes) / 60.0
            for k in calculated_totals:
                self.assertAlmostEqual(calculated_totals[k], log.totals.get(k, 0), delta=0.1)

    def test_adv_11h_multiple_events(self):
        result = plan_trip(distance_miles=1500, duration_hours=25.0, current_cycle_used=0, pickup_location="A", dropoff_location="B")
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        driving_in_window = 0
        for e in events:
            if e.note in ("10-hour rest", "34-hour restart"):
                driving_in_window = 0
            if e.status == "driving":
                driving_in_window += (e.end_minutes - e.start_minutes)
                self.assertLessEqual(driving_in_window, 11 * 60 + 1)

    def test_adv_14h_not_reset_by_30m(self):
        result = plan_trip(distance_miles=800, duration_hours=13.0, current_cycle_used=0, pickup_location="A", dropoff_location="B", pickup_mileage=300.0)
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        window_start = -1
        for e in events:
            if e.status in ("on_duty", "driving") and window_start < 0:
                window_start = e.start_minutes
            if e.note in ("10-hour rest", "34-hour restart"):
                window_start = -1
            if e.status == "driving":
                shift_elapsed = e.start_minutes - window_start
                self.assertLess(shift_elapsed, 14 * 60)
            if e.note == "30-minute break":
                self.assertNotEqual(window_start, -1)
                
    def test_adv_30m_break(self):
        result = plan_trip(distance_miles=600, duration_hours=10.0, current_cycle_used=0, pickup_location="A", dropoff_location="B", pickup_mileage=100.0)
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        driving_since_break = 0
        for e in events:
            if e.note in ("30-minute break", "10-hour rest", "34-hour restart"):
                driving_since_break = 0
            if e.status == "driving":
                self.assertLessEqual(driving_since_break, 8 * 60)
                driving_since_break += (e.end_minutes - e.start_minutes)

    def test_adv_10h_reset(self):
        result = plan_trip(distance_miles=800, duration_hours=14.0, current_cycle_used=0, pickup_location="A", dropoff_location="B", pickup_mileage=400.0)
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        window_start = -1
        for e in events:
            if e.status in ("on_duty", "driving") and window_start < 0:
                window_start = e.start_minutes
            if e.note == "10-hour rest":
                window_start = -1
            if e.status == "driving":
                self.assertLessEqual(e.start_minutes - window_start, 14 * 60)

    def test_adv_70h_cycle(self):
        result = plan_trip(distance_miles=500, duration_hours=9.0, current_cycle_used=69.0, pickup_location="A", dropoff_location="B")
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        cycle_used = 69.0 * 60
        for e in events:
            if e.note == "34-hour restart":
                cycle_used = 0
            if e.status in ("driving", "on_duty"):
                cycle_used += (e.end_minutes - e.start_minutes)
                self.assertLessEqual(cycle_used, 70 * 60 + 0.1)
                
    def test_adv_pickup_interaction(self):
        result = plan_trip(distance_miles=600, duration_hours=10.0, current_cycle_used=0, pickup_location="A", dropoff_location="B", pickup_mileage=430.0)
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        pickup_event = next(e for e in events if e.note == "Pickup")
        self.assertEqual(pickup_event.status, "on_duty")
        self.assertEqual(pickup_event.end_minutes - pickup_event.start_minutes, 60)
        
        driving_since_break = 0
        pre_pickup = -1
        post_pickup = -1
        for e in events:
            if e.note in ("30-minute break", "10-hour rest", "34-hour restart"):
                driving_since_break = 0
            if e.note == "Pickup":
                pre_pickup = driving_since_break
            elif pre_pickup >= 0 and post_pickup < 0:
                
                post_pickup = driving_since_break
                
            if e.status == "driving":
                driving_since_break += (e.end_minutes - e.start_minutes)

        self.assertEqual(pre_pickup, post_pickup)

    def test_adv_30m_semantics_on_duty(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 480, "", "")
        self.assertEqual(state.drive_since_break, 480)
        state.add_event("on_duty", 30, "", "Pickup") 
        self.assertEqual(state.drive_since_break, 0) 

    def test_adv_30m_semantics_off_duty(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 480, "", "")
        state.add_event("off_duty", 30, "", "30-minute break")
        self.assertEqual(state.drive_since_break, 0)

    def test_adv_30m_semantics_sleeper(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 480, "", "")
        state.add_event("sleeper_berth", 30, "", "")
        self.assertEqual(state.drive_since_break, 0)

    def test_adv_30m_semantics_29_min(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 480, "", "")
        state.add_event("on_duty", 29, "", "Fuel stop")
        self.assertEqual(state.drive_since_break, 480)
        state.add_event("driving", 1, "", "")
        self.assertEqual(state.drive_since_break, 481)

    def test_adv_30m_semantics_split(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 400, "", "")
        state.add_event("on_duty", 15, "", "")
        state.add_event("driving", 10, "", "")
        state.add_event("off_duty", 15, "", "")
        self.assertEqual(state.drive_since_break, 410) 

    def test_adv_30m_no_reset_14h(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 480, "", "")
        state.add_event("off_duty", 30, "", "30-minute break")
        self.assertEqual(state.window_start, 0)

    def test_adv_30m_no_reset_70h(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 480, "", "")
        state.add_event("off_duty", 30, "", "30-minute break")
        self.assertEqual(state.cycle_used, 480) 

    def test_adv_10h_resets_14h(self):
        from trip.hos_engine import HOSState
        state = HOSState(0, 0)
        state.add_event("driving", 480, "", "")
        state.add_event("off_duty", 600, "", "10-hour rest")
        self.assertEqual(state.window_start, -1)

    def test_adv_70h_boundaries(self):
        boundaries = [69.0, 69.5, 69.99, 70.0]
        for c in boundaries:
            with self.subTest(cycle_start=c):
                result = plan_trip(distance_miles=500, duration_hours=9.0, current_cycle_used=c, pickup_location="A", dropoff_location="B")
                daily_logs, _ = result
                events = [e for log in daily_logs for e in log.events]
                
                cycle_used = c * 60
                restart_found = False
                for e in events:
                    if e.status in ("driving", "on_duty"):
                        cycle_used += (e.end_minutes - e.start_minutes)
                        self.assertLessEqual(round(cycle_used, 1), 70 * 60)
                    
                    if e.note == "34-hour restart":
                        restart_found = True
                        cycle_used = 0
                
                self.assertTrue(restart_found)

    def test_adv_70h_11h_collision(self):
        result = plan_trip(distance_miles=1500, duration_hours=25.0, current_cycle_used=59.0, pickup_location="A", dropoff_location="B")
        daily_logs, _ = result
        events = [e for log in daily_logs for e in log.events]
        
        cycle_used = 59.0 * 60
        driving_in_window = 0
        window_start = -1
        
        for e in events:
            if e.status in ("driving", "on_duty"):
                cycle_used += (e.end_minutes - e.start_minutes)
                self.assertLessEqual(round(cycle_used, 1), 70 * 60)
                if window_start < 0:
                    window_start = e.start_minutes
            
            if e.note in ("10-hour rest", "34-hour restart"):
                driving_in_window = 0
                window_start = -1
            if e.note == "34-hour restart":
                cycle_used = 0
                
            if e.status == "driving":
                driving_in_window += (e.end_minutes - e.start_minutes)
                self.assertLessEqual(round(driving_in_window, 1), 11 * 60)
                self.assertLessEqual(e.start_minutes - window_start, 14 * 60)

if __name__ == "__main__":
    unittest.main()
