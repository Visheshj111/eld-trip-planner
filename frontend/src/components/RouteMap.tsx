import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { RouteData } from "../api/types";

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
  const fitted = useRef(false);

  useEffect(() => {
    if (geometry && geometry.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(
        geometry.map(([lat, lng]) => [lat, lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
      fitted.current = true;
    }
  }, [geometry, map]);

  return null;
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
    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
  },
};

export default function RouteMap({ route, initialLocation, layerType = "osm" }: RouteMapProps) {
  const center: [number, number] = route && route.geometry.length > 0
    ? route.geometry[Math.floor(route.geometry.length / 2)]
    : initialLocation || [39.8283, -98.5795];

  const layer = LAYERS[layerType] || LAYERS.osm;

  return (
    <MapContainer
      center={center}
      zoom={route ? 6 : 13}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: 12,
        minHeight: 400,
      }}
    >
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
            Mile {stop.mile}
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
    </MapContainer>
  );
}
