# ELD Trip Planner 🚛

A full-stack trip planning tool for truck drivers that generates FMCSA-compliant Hours of Service (HOS) logs. You enter where you are, where you're picking up, and where you're dropping off — the app calculates the full route, figures out when you legally need to stop (rest breaks, fuel stops, the works), and renders proper ELD-style daily log sheets you'd actually recognize from the real thing.

Built with **React + Material UI** on the frontend and **Django REST Framework** on the backend.

---

## What It Does

**The short version:** Give it three locations and your current cycle hours, and it hands back a multi-day trip plan with legally compliant HOS scheduling.

**The longer version:**

- **Route Calculation** — Uses OpenRouteService to compute actual driving routes between your current location → pickup → dropoff. Not straight lines; real roads.
- **HOS Engine** — A from-scratch Python state machine that enforces FMCSA 70-hour/8-day rules: 11-hour driving limits, 14-hour windows, mandatory 30-minute breaks, 10-hour rest periods, fuel stops every ~1000 miles, and 34-hour restarts when the cycle runs out.
- **ELD Log Sheets** — The frontend renders SVG-based daily log grids that look like the real FMCSA Form 395 paper logs. Each day shows the four duty statuses (Off Duty, Sleeper Berth, Driving, On Duty) with proper horizontal bars and vertical transitions.
- **Interactive Map** — Leaflet map with the full route polyline, color-coded markers for every stop (fuel, rest, pickup, dropoff), and switchable tile layers (street, satellite, terrain).
- **Multi-Day Support** — Long hauls automatically split across multiple days with proper continuation logic. Day 2 picks up exactly where Day 1 left off.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Material UI 9, Leaflet, Axios |
| Backend | Python, Django 4.2+, Django REST Framework |
| Routing API | OpenRouteService (free tier) |
| Geocoding | Nominatim / OpenStreetMap (no key needed) |
| Map Tiles | OpenStreetMap, Esri Satellite, OpenTopoMap (all free) |
| Containerization | Docker, Docker Compose |
| Deployment | Render (backend), Vercel (frontend) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- An [OpenRouteService API key](https://openrouteservice.org/dev/#/signup) (free)

### Local Setup

**1. Clone the repo**

```bash
git clone https://github.com/Visheshj111/eld-trip-planner.git
cd eld-trip-planner
```

**2. Backend**

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create your `.env` file (just copy the example):

```bash
cp .env.example .env
```

Then open `.env` and paste in your ORS API key:

```env
ORS_API_KEY=your_actual_key_here
DEBUG=True
ALLOWED_HOSTS=*
```

Start the server:

```bash
python manage.py migrate
python manage.py runserver
```

Backend runs on `http://localhost:8000`.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### Docker (Alternative)

If you'd rather not set up Python and Node locally:

```bash
# Make sure backend/.env exists with your ORS_API_KEY
docker compose up --build -d
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

---

## API

### `POST /api/trip/`

Plan a trip. Send JSON:

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Dallas, TX",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 20
}
```

Returns route geometry, daily log events, map stop markers, and HOS totals.

### `GET /api/health/`

Health check. Returns `{"status": "ok"}`. No external API calls, no cache writes — safe for uptime monitoring.

---

## HOS Rules Implemented

The engine follows FMCSA Part 395 regulations for property-carrying drivers:

- **11-Hour Driving Limit** — Max 11 hours of driving after 10 consecutive hours off duty
- **14-Hour Window** — Can't drive beyond the 14th hour after coming on duty
- **30-Minute Break** — Required after 8 cumulative hours of driving
- **10-Hour Rest** — 8 hours sleeper berth + 2 hours off duty
- **70-Hour/8-Day Limit** — No driving after 70 hours on duty in 8 consecutive days
- **34-Hour Restart** — Resets the 70-hour clock
- **Fuel Stops** — Every ~1,000 miles, with 1-hour on-duty time for fueling

---

## Project Structure

```
eld-trip-planner/
├── backend/
│   ├── eldapp/              # Django project settings
│   │   ├── settings.py      # Env-driven config (DEBUG, SECRET_KEY, ALLOWED_HOSTS)
│   │   └── urls.py          # Root URL config → /api/ prefix
│   ├── trip/
│   │   ├── hos_engine.py    # The HOS state machine (core logic)
│   │   ├── geocoding.py     # Nominatim geocoding + ORS routing
│   │   ├── views.py         # Trip planning endpoint + health check
│   │   ├── serializers.py   # DRF input validation
│   │   ├── test_hos_engine.py  # Unit tests for HOS logic
│   │   └── urls.py          # /trip/ and /health/ routes
│   ├── .env.example         # Template for environment variables
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TripForm.tsx      # Trip input form with rotating loader messages
│   │   │   ├── ELDLogSheet.tsx   # SVG-rendered daily log grid
│   │   │   └── RouteMap.tsx      # Leaflet map with route + markers
│   │   ├── api/
│   │   │   ├── trip.ts           # Axios API client
│   │   │   └── types.ts          # TypeScript interfaces
│   │   ├── ThemeContext.tsx       # Dark/light mode, accent colors, units, map layers
│   │   ├── theme.ts              # MUI theme tokens
│   │   └── App.tsx               # Main layout with settings panel
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .gitignore
```

---

## Notable Details

- **Caching** — Route and geocoding results are cached in Django's LocMemCache so repeated queries don't burn ORS quota.
- **Unit Switching** — Toggle between miles and kilometers from the settings panel. The ELD log sheets update in real-time.
- **Theme System** — Light/dark mode with multiple accent color presets (teal, blue, amber, rose, violet). Persisted in localStorage.
- **Driver Details** — Name, tractor number, and trailer info entered in the form sync live into the SVG log sheet header.
- **Responsive Loading** — 29 rotating trucker-themed messages while the backend crunches the route ("Fueling up the rig...", "Tuning the CB radio...", etc.)
- **Production-Ready Settings** — `DEBUG`, `SECRET_KEY`, and `ALLOWED_HOSTS` all read from environment variables with secure fallback defaults (fails closed, not open).

---

## Tests

```bash
cd backend
python manage.py test trip.test_hos_engine
```

Covers the core HOS scenarios: 11-hour driving limits, 30-minute break triggers, 10-hour rest splits, 34-hour restarts, fuel stop spacing, and multi-day rollover.

---

## License

This project was built as a full-stack assessment submission.
