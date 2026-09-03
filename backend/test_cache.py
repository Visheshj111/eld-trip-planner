import requests
import time

url = "http://localhost:8000/api/trip/"
payload = {
    "current_location": "Chicago, IL",
    "pickup_location": "Chicago, IL",
    "dropoff_location": "Dallas, TX",
    "current_cycle_used": 69.0
}

print("First request...")
t1 = time.time()
r1 = requests.post(url, json=payload)
print(f"Status: {r1.status_code}, Time: {time.time() - t1:.2f}s")

print("Second request (should be cached)...")
t2 = time.time()
r2 = requests.post(url, json=payload)
print(f"Status: {r2.status_code}, Time: {time.time() - t2:.2f}s")
