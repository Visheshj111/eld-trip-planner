import { useState, useRef, useEffect, useContext } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Truck, Bell, Download, RefreshCw, Shield, Layers, Expand, CheckCircle2, Moon, Sun, ClipboardList, BarChart3, MapPin } from "lucide-react";
import TripForm from "./components/TripForm";
import RouteMap from "./components/RouteMap";
import ELDLogSheet from "./components/ELDLogSheet";
import { planTrip } from "./api/trip";
import type { TripRequest, TripResponse, DriverDetails } from "./api/types";
import { ThemeContext } from "./ThemeContext";

export default function App() {
  const { mode, toggleColorMode } = useContext(ThemeContext);
  const [result, setResult] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | undefined>(undefined);

  const [initialLocation, setInitialLocation] = useState<[number, number] | null>(null);
  const [mapLayer, setMapLayer] = useState<"osm" | "satellite" | "terrain">("osm");
  const [layerAnchor, setLayerAnchor] = useState<null | HTMLElement>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInitialLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setInitialLocation([39.8283, -98.5795]);
        }
      );
    } else {
      setInitialLocation([39.8283, -98.5795]);
    }
  }, []);

  const estimatedEtaDays = result ? result.daily_logs.length : 0;
  const estimatedStops = result ? result.route.stops.length : 0;

  const handleSubmit = async (data: TripRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentDay(0);
    setDriverDetails(data.driver_details);

    try {
      const response = await planTrip(data);
      setResult(response);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to plan trip. Please check your inputs and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLoading(false);
    setError(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", display: "flex", flexDirection: "column" }}>

      <Box component="header" sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", px: { xs: 2, lg: 3 }, py: 1.5 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1600, mx: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", px: "0 !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={20} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.025em" }}>NORTHSTAR ELD</Typography>
              <Typography sx={{ fontSize: "0.6875rem", fontFamily: "monospace", color: "text.secondary", mt: -0.2 }}>FMCSA COMPLIANCE WORKSPACE</Typography>
            </Box>
          </Box>
          <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 3 }}>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>Driver</Typography>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {driverDetails?.driver_name || "Driver"}
                {driverDetails?.tractor_number ? ` · Unit ${driverDetails.tractor_number}` : ""}
              </Typography>
            </Box>
            <IconButton onClick={toggleColorMode} sx={{ color: "text.primary" }}>
              {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
            <Box sx={{ height: 32, borderLeft: 1, borderColor: "divider" }} />
            <Button variant="outlined" color="inherit" startIcon={<Bell size={18} color="#2563EB" />} sx={{ borderColor: "divider", color: "text.primary" }}>
              2 alerts
            </Button>
            <Button variant="contained" startIcon={<Download size={18} />}>
              Export log
            </Button>
          </Box>
        </Container>
      </Box>

      <Container component="main" maxWidth={false} sx={{ maxWidth: 1600, mx: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 3, p: { xs: 2, lg: 3 }, px: "16px !important" }}>

        {/* Top row: form sidebar + map — aligned to the same height */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3, alignItems: "stretch" }}>

          <Box sx={{ width: { xs: "100%", lg: 340 }, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <Card sx={{ p: 2, borderRadius: 3, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontFamily: "monospace", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "primary.main" }}>Route parameters</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>Plan a compliant run</Typography>
                </Box>
                <IconButton onClick={handleReset} sx={{ bgcolor: "secondary.main", borderRadius: 2 }}>
                  <RefreshCw size={18} color="#2563EB" />
                </IconButton>
              </Box>
              <TripForm onSubmit={handleSubmit} loading={loading} />
            </Card>
          </Box>

          <Card sx={{ flex: 1, borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 1.5, borderBottom: 1, borderColor: "divider", px: 2, py: 1.5, alignItems: { sm: "center" }, flexShrink: 0 }}>
              <Box>
                <Typography sx={{ fontFamily: "monospace", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "primary.main" }}>
                  {result ? `Active route · ${result.route.distance_miles.toFixed(1)} mi` : "Route map"}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, fontSize: "1.125rem" }}>
                  {result ? "Route plotted successfully" : "Awaiting destination"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button variant="outlined" color="inherit" onClick={(e) => setLayerAnchor(e.currentTarget)} startIcon={<Layers size={16} />} sx={{ borderColor: "divider", color: "text.primary" }}>
                  Map layers
                </Button>
                <Menu anchorEl={layerAnchor} open={Boolean(layerAnchor)} onClose={() => setLayerAnchor(null)}>
                  <MenuItem onClick={() => { setMapLayer("osm"); setLayerAnchor(null); }}>Standard (OSM)</MenuItem>
                  <MenuItem onClick={() => { setMapLayer("satellite"); setLayerAnchor(null); }}>Satellite</MenuItem>
                  <MenuItem onClick={() => { setMapLayer("terrain"); setLayerAnchor(null); }}>Terrain</MenuItem>
                </Menu>
                <IconButton onClick={toggleFullscreen} sx={{ border: 1, borderColor: "divider", borderRadius: 2, height: 40, width: 40 }}>
                  <Expand size={18} />
                </IconButton>
              </Box>
            </Box>
            <Box ref={mapContainerRef} sx={{ flex: 1, minHeight: 300, bgcolor: "secondary.main", position: "relative" }}>
              {loading ? (
                <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
              ) : result ? (
                <RouteMap route={result.route} layerType={mapLayer} />
              ) : initialLocation ? (
                <RouteMap initialLocation={initialLocation} layerType={mapLayer} />
              ) : (
                <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
              )}
            </Box>
          </Card>

        </Box>

        {/* Daily Log — full width */}
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, borderBottom: 1, borderColor: "divider", p: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontFamily: "monospace", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "primary.main" }}>FMCSA daily log</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, fontSize: "1.125rem" }}>
                Duty status {result ? `· Day ${currentDay + 1} of ${result.daily_logs.length}` : ""}
              </Typography>
            </Box>
            {result && result.daily_logs.length > 0 && (
              <Box sx={{ display: "flex", overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 2, p: 0.5, bgcolor: "background.paper" }}>
                {result.daily_logs.map((_, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setCurrentDay(idx)}
                    sx={{
                      minWidth: "auto",
                      px: 2,
                      py: 0.5,
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: currentDay === idx ? "primary.contrastText" : "text.secondary",
                      bgcolor: currentDay === idx ? "primary.main" : "transparent",
                      "&:hover": { bgcolor: currentDay === idx ? "primary.dark" : "secondary.main" },
                    }}
                  >
                    Day {idx + 1}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ p: 2 }} ref={resultsRef}>
            {loading ? (
              <Skeleton variant="rounded" height={300} animation="wave" />
            ) : result ? (
              <ELDLogSheet log={result.daily_logs[currentDay]} driverDetails={driverDetails} />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "secondary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ClipboardList size={28} color="#94A3B8" />
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "text.primary" }}>No log sheet generated yet</Typography>
                <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", textAlign: "center", maxWidth: 360 }}>
                  Enter your route details and click "Plan Trip" to generate a fully compliant ELD daily log.
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* Trip Economics + HOS Guardrails row */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, pb: 3 }}>

          <Card sx={{ p: 2, borderRadius: 3, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.125rem" }}>Trip economics</Typography>
              <Box sx={{ bgcolor: result ? "#D1FAE5" : "secondary.main", color: result ? "#059669" : "text.secondary", px: 1, py: 0.5, borderRadius: 4, fontFamily: "monospace", fontSize: "0.625rem", fontWeight: 700 }}>
                {result ? "ACTIVE" : loading ? "CALCULATING" : "STANDBY"}
              </Box>
            </Box>
            {loading ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                {[0,1,2,3].map(i => <Skeleton key={i} variant="rounded" height={72} />)}
              </Box>
            ) : result ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>Distance</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {result.route.distance_miles.toFixed(1)} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>mi</Typography>
                  </Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>Drive time</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {result.route.duration_hours.toFixed(1)} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>hrs</Typography>
                  </Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>Required stops</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {estimatedStops} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>stops</Typography>
                  </Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>ETA</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {estimatedEtaDays} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>days</Typography>
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "secondary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={22} color="#94A3B8" />
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "text.primary" }}>Awaiting trip data</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center", maxWidth: 240 }}>
                  Distance, drive time, stops, and ETA will appear here after planning.
                </Typography>
              </Box>
            )}
          </Card>

          <Card sx={{ p: 2, borderRadius: 3, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.125rem" }}>HOS guardrails</Typography>
              <Shield size={20} color={result ? "#10B981" : "#94A3B8"} />
            </Box>
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Skeleton variant="rounded" height={40} />
                <Skeleton variant="rounded" height={40} />
                <Skeleton variant="rounded" height={48} />
              </Box>
            ) : result ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>Driving window</Typography>
                    <Typography sx={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.75rem" }}>{Number((result.daily_logs[0]?.totals.driving || 0).toFixed(1))}h / 11h</Typography>
                  </Box>
                  <Box sx={{ height: 6, bgcolor: "secondary.main", borderRadius: 3, overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${Math.min(100, (result.daily_logs[0]?.totals.driving / 11) * 100)}%`, bgcolor: "#10B981", borderRadius: 3 }} />
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>On-duty window</Typography>
                    <Typography sx={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.75rem" }}>{Number(((result.daily_logs[0]?.totals.driving || 0) + (result.daily_logs[0]?.totals.on_duty || 0)).toFixed(1))}h / 14h</Typography>
                  </Box>
                  <Box sx={{ height: 6, bgcolor: "secondary.main", borderRadius: 3, overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${Math.min(100, ((result.daily_logs[0]?.totals.driving + result.daily_logs[0]?.totals.on_duty) / 14) * 100)}%`, bgcolor: "primary.main", borderRadius: 3 }} />
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, bgcolor: "secondary.light", p: 1.5, borderRadius: 2, mt: 1 }}>
                  <CheckCircle2 size={16} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "text.primary" }}>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>No violation predicted.</Typography> All breaks and rest periods are scheduled correctly.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "secondary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={22} color="#94A3B8" />
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "text.primary" }}>Compliance check pending</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center", maxWidth: 240 }}>
                  HOS driving and on-duty window analysis will display after trip planning.
                </Typography>
              </Box>
            )}
          </Card>

        </Box>

      </Container>

      <Snackbar open={!!error} autoHideDuration={8000} onClose={() => setError(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setError(null)} severity="error" variant="filled" sx={{ width: "100%", maxWidth: 500 }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
