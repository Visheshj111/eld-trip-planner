import { useEffect, useRef, useContext } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { RouteData } from "../api/types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { LocateFixed } from "lucide-react";
import { ThemeContext } from "../ThemeContext";

interface RouteMapProps {
  route?: RouteData;
  initialLocation?: [number, number];
  layerType?: "osm" | "satellite" | "terrain";
}

const STOP_ICONS: Record<string, L.Icon> = {
  pickup: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  dropoff: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  fuel: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
  rest: new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

function FitBounds({ geometry }: { geometry?: [number, number][] }) {
  const map = useMap();
  const prevGeometry = useRef<[number, number][] | undefined>(undefined);

  useEffect(() => {
    if (geometry && geometry.length > 0 && geometry !== prevGeometry.current) {
      const bounds = L.latLngBounds(
        geometry.map(([lat, lng]) => [lat, lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
      prevGeometry.current = geometry;
    }
  }, [geometry, map]);

  return null;
}

function MapScrollHandler() {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.disable();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.metaKey) {
        map.scrollWheelZoom.enable();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        map.scrollWheelZoom.disable();
      }
    };
    const handleBlur = () => map.scrollWheelZoom.disable();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [map]);

  return null;
}

function CurrentLocationControl({ initialLocation }: { initialLocation?: [number, number] }) {
  const map = useMap();
  
  if (!initialLocation) return null;

  return (
    <Box sx={{
      position: "absolute",
      top: 80,
      left: 10,
      zIndex: 1000,
    }}>
      <IconButton 
        onClick={() => map.flyTo(initialLocation, 13)}
        title="Go to Current Location"
        sx={{ 
          bgcolor: "#fff",
          color: "#444",
          border: "2px solid rgba(0,0,0,0.2)",
          backgroundClip: "padding-box",
          width: 34,
          height: 34,
          borderRadius: 1,
          "&:hover": { bgcolor: "#f4f4f4" }
        }}
      >
        <LocateFixed size={18} strokeWidth={2.5} />
      </IconButton>
    </Box>
  );
}

const LAYERS = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  },
};

export default function RouteMap({ route, initialLocation, layerType = "osm" }: RouteMapProps) {
  const { unit } = useContext(ThemeContext);
  const center: [number, number] = route && route.geometry.length > 0
    ? route.geometry[Math.floor(route.geometry.length / 2)]
    : initialLocation || [39.8283, -98.5795];

  const layer = LAYERS[layerType] || LAYERS.osm;

  return (
    <Box sx={{ position: "relative", height: "100%", width: "100%", minHeight: 400 }}>
      <MapContainer
        center={center}
        zoom={route ? 6 : 13}
        scrollWheelZoom={false}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 12,
          minHeight: 400,
        }}
      >
        <MapScrollHandler />
        <TileLayer
          attribution={layer.attribution}
          url={layer.url}
        />

        {route && (
          <Polyline
            positions={route.geometry}
            pathOptions={{
              color: "#0052CC",
              weight: 4,
              opacity: 0.85,
            }}
          />
        )}

        {route && route.stops.map((stop, idx) => (
          <Marker
            key={`${stop.type}-${idx}`}
            position={stop.location}
            icon={STOP_ICONS[stop.type] || STOP_ICONS.rest}
          >
            <Popup>
              <strong>{stop.label}</strong>
              <br />
              {unit === "km" ? "Km" : "Mile"} {(unit === "km" ? stop.mile * 1.60934 : stop.mile).toFixed(1)}
            </Popup>
          </Marker>
        ))}

        {!route && initialLocation && (
          <Marker
            position={initialLocation}
            icon={STOP_ICONS.rest}
          >
            <Popup>
              <strong>Your Location</strong>
            </Popup>
          </Marker>
        )}

        {route && <FitBounds geometry={route.geometry} />}
        
        <CurrentLocationControl initialLocation={initialLocation} />
      </MapContainer>

      <Box sx={{
        position: "absolute",
        bottom: 20,
        left: 10,
        zIndex: 1000,
        pointerEvents: "none",
        bgcolor: "background.paper",
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        fontSize: "0.55rem",
        fontWeight: 500,
        color: "text.secondary",
        fontFamily: "'DM Sans', sans-serif",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        opacity: 0.9,
      }}>
        Ctrl + Scroll to zoom
      </Box>

      {route && (
        <Box sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          bgcolor: "background.paper",
          p: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, fontFamily: "'Outfit', sans-serif", mb: 0.5, color: "text.primary" }}>Legend</Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#22C55E", border: "1px solid rgba(0,0,0,0.1)" }} />
            <Typography sx={{ fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif", color: "text.secondary" }}>Pickup</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#EF4444", border: "1px solid rgba(0,0,0,0.1)" }} />
            <Typography sx={{ fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif", color: "text.secondary" }}>Dropoff</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#F97316", border: "1px solid rgba(0,0,0,0.1)" }} />
            <Typography sx={{ fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif", color: "text.secondary" }}>Fuel</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#3B82F6", border: "1px solid rgba(0,0,0,0.1)" }} />
            <Typography sx={{ fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif", color: "text.secondary" }}>Rest / Stop</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
