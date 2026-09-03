import hashlib
import requests
from django.conf import settings
from django.core.cache import cache


ORS_BASE_URL = "https://api.openrouteservice.org"


def _cache_key(prefix, value):
    h = hashlib.md5(value.encode()).hexdigest()
    return f"{prefix}:{h}"


def _do_geocode(location_string):
    response = requests.get(
        f"{ORS_BASE_URL}/geocode/search",
        params={
            "api_key": settings.ORS_API_KEY,
            "text": location_string,
            "size": 1,
        },
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    features = data.get("features", [])
    if not features:
        return None, None
    return features[0]["geometry"]["coordinates"], features[0].get("properties", {})


def geocode(location_string):
    key = _cache_key("geo", location_string)
    cached = cache.get(key)
    if cached is not None:
        print(f"[GEOCODE] Cache hit for: {location_string}")
        return cached

    print(f"[GEOCODE] Cache miss for: {location_string}, fetching from ORS...")

    parts = [p.strip() for p in location_string.split(",")]
    expected_state = parts[-1].upper() if len(parts) >= 2 and len(parts[-1].strip()) == 2 else ""
    name_tokens = parts[0].split() if len(parts) >= 2 else location_string.split()
    
    valid_coords = None
    for i in range(len(name_tokens), 0, -1):
        query_city = " ".join(name_tokens[:i])
        query = f"{query_city}, {expected_state}" if expected_state else query_city
        
        coords, props = _do_geocode(query)
        if not coords:
            continue
            
        returned_state_a = props.get("region_a", "").upper()
        returned_state = props.get("region", "").upper()
        locality = props.get("locality", "").lower()
        label = props.get("label", "").lower()
        
        state_match = True
        if expected_state:
            state_match = (expected_state == returned_state_a or expected_state == returned_state)
            
        city_match = False
        original_lower = location_string.lower()
        if locality and locality in original_lower:
            city_match = True
        elif query_city.lower() in locality or query_city.lower() in label:
            city_match = True
            
        if state_match and city_match:
            valid_coords = coords
            break
            
    if not valid_coords:
        raise ValueError(f"Could not confidently geocode location: {location_string}")

    result = (valid_coords[1], valid_coords[0])
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

    total_distance_miles = total_distance_m * 0.000621371
    total_duration_hours = total_duration_s / 3600

    result = {
        "geometry": route_points,
        "distance_miles": round(total_distance_miles, 1),
        "duration_hours": round(total_duration_hours, 2),
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
        f"{ORS_BASE_URL}/geocode/reverse",
        params={
            "api_key": settings.ORS_API_KEY,
            "point.lat": lat,
            "point.lon": lng,
            "size": 1,
        },
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    features = data.get("features", [])
    if not features:
        return f"{lat:.4f}, {lng:.4f}"

    props = features[0].get("properties", {})
    city = props.get("locality", props.get("name", ""))
    region = props.get("region_a", props.get("region", ""))

    if city and region:
        result = f"{city}, {region}"
    elif city:
        result = city
    else:
        result = f"{lat:.4f}, {lng:.4f}"

    cache.set(key, result, timeout=86400)
    return result


def interpolate_point_on_route(geometry, total_distance_miles, target_mile):
    if not geometry or total_distance_miles <= 0:
        return geometry[0] if geometry else [0, 0]

    fraction = target_mile / total_distance_miles
    fraction = max(0, min(1, fraction))

    index = fraction * (len(geometry) - 1)
    lower = int(index)
    upper = min(lower + 1, len(geometry) - 1)
    t = index - lower

    lat = geometry[lower][0] + t * (geometry[upper][0] - geometry[lower][0])
    lng = geometry[lower][1] + t * (geometry[upper][1] - geometry[lower][1])

    return [round(lat, 6), round(lng, 6)]
