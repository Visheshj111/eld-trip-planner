import hashlib
import time
import requests
from django.conf import settings
from django.core.cache import cache


ORS_BASE_URL = "https://api.openrouteservice.org"
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
NOMINATIM_HEADERS = {
    "User-Agent": "ELD-Trip-Planner/1.0",
    "Accept-Language": "en",
}


def _cache_key(prefix, value):
    h = hashlib.md5(value.encode()).hexdigest()
    return f"{prefix}:{h}"


def _nominatim_search(query: str):
    response = requests.get(
        f"{NOMINATIM_BASE_URL}/search",
        params={
            "q": query,
            "format": "json",
            "limit": 1,
            "countrycodes": "us",
            "addressdetails": 1,
        },
        headers=NOMINATIM_HEADERS,
        timeout=10,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        return None
    r = results[0]
    return float(r["lat"]), float(r["lon"])


def geocode(location_string: str):
    key = _cache_key("geo", location_string)
    cached = cache.get(key)
    if cached is not None:
        return cached

    parts = [p.strip() for p in location_string.split(",")]
    candidates = [location_string]

    if len(parts) >= 2:
        city_tokens = parts[0].split()
        state = parts[-1].strip()
        for n in range(len(city_tokens), 0, -1):
            shorter = " ".join(city_tokens[:n])
            q = f"{shorter}, {state}" if state else shorter
            if q != location_string:
                candidates.append(q)

    result = None
    for query in candidates:
        coords = _nominatim_search(query)
        if coords:
            result = coords
            break
        time.sleep(1)

    if result is None:
        raise ValueError(f"Could not geocode location: {location_string!r}")

    cache.set(key, result, timeout=86400)
    return result


def get_route(coordinates_list):
    coords_str = ";".join(f"{c[1]},{c[0]}" for c in coordinates_list)
    key = _cache_key("route", coords_str)
    cached = cache.get(key)
    if cached is not None:
        return cached

    body = {
        "coordinates": [[c[1], c[0]] for c in coordinates_list],
    }

    response = requests.post(
        f"{ORS_BASE_URL}/v2/directions/driving-hgv/geojson",
        json=body,
        headers={
            "Authorization": settings.ORS_API_KEY,
            "Content-Type": "application/json",
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    feature = data["features"][0]
    geometry_coords = feature["geometry"]["coordinates"]
    props = feature["properties"]
    segments = props.get("segments", [])

    total_distance_m = sum(s["distance"] for s in segments)
    total_duration_s = sum(s["duration"] for s in segments)

    route_points = [[c[1], c[0]] for c in geometry_coords]

    result = {
        "geometry": route_points,
        "distance_miles": round(total_distance_m * 0.000621371, 1),
        "duration_hours": round(total_duration_s / 3600, 2),
        "segments": segments,
    }

    cache.set(key, result, timeout=3600)
    return result


def reverse_geocode(lat, lng):
    key = _cache_key("revgeo", f"{lat:.4f},{lng:.4f}")
    cached = cache.get(key)
    if cached is not None:
        return cached

    response = requests.get(
        f"{NOMINATIM_BASE_URL}/reverse",
        params={
            "lat": lat,
            "lon": lng,
            "format": "json",
            "zoom": 10,
        },
        headers=NOMINATIM_HEADERS,
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    addr = data.get("address", {})
    city = addr.get("city") or addr.get("town") or addr.get("village") or ""
    state = addr.get("state_code") or addr.get("state") or ""

    if city and state:
        result = f"{city}, {state}"
    elif city:
        result = city
    else:
        result = f"{lat:.4f}, {lng:.4f}"

    cache.set(key, result, timeout=86400)
    return result


def interpolate_point_on_route(geometry, total_distance_miles, target_mile):
    if not geometry or total_distance_miles <= 0:
        return geometry[0] if geometry else [0, 0]

    fraction = max(0, min(1, target_mile / total_distance_miles))
    index = fraction * (len(geometry) - 1)
    lower = int(index)
    upper = min(lower + 1, len(geometry) - 1)
    t = index - lower

    lat = geometry[lower][0] + t * (geometry[upper][0] - geometry[lower][0])
    lng = geometry[lower][1] + t * (geometry[upper][1] - geometry[lower][1])

    return [round(lat, 6), round(lng, 6)]
