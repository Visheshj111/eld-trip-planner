import { useState, useRef, useEffect, useContext } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTheme, alpha } from "@mui/material/styles";
import { Settings, Truck, Bell, Download, RefreshCw, Shield, Layers, Expand, CheckCircle2, Moon, Sun, ClipboardList, BarChart3, MapPin, Route, Monitor, Ruler, Palette, Map as MapIcon } from "lucide-react";
import TripForm from "./components/TripForm";
import RouteMap from "./components/RouteMap";
import ELDLogSheet from "./components/ELDLogSheet";
import { planTrip } from "./api/trip";
import type { TripRequest, TripResponse, DriverDetails } from "./api/types";
import { ThemeContext, type AccentColor, type ThemeMode, type Unit, type MapLayer } from "./ThemeContext";

export default function App() {
  const theme = useTheme();
  const { mode, toggleColorMode, themeMode, setThemeMode, accentColor, setAccentColor, unit, setUnit, mapLayer, setMapLayer } = useContext(ThemeContext);
  const [result, setResult] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | undefined>(undefined);
  const [liveDriverDetails, setLiveDriverDetails] = useState<DriverDetails | undefined>(undefined);

  const [initialLocation, setInitialLocation] = useState<[number, number] | null>(null);
  const [layerAnchor, setLayerAnchor] = useState<null | HTMLElement>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [spotlight, setSpotlight] = useState(false);

  const handleSpotlight = () => {
    setSpotlight(true);
    setTimeout(() => {
      document.getElementById("plan-trip-btn")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    setTimeout(() => setSpotlight(false), 1200);
  };

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
      let message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to plan trip. Please check your inputs and try again.";
        
      if (typeof message === "string" && (message.includes("404") || message.includes("Not Found") || message.includes("openrouteservice"))) {
        message = "We couldn't calculate a valid driving route between the provided locations. Please verify the addresses and try again.";
      }
      
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

  const primaryMain = theme.palette.primary.main;
  const primaryMuted = alpha(theme.palette.primary.main, mode === "dark" ? 0.15 : 0.08);
  const amber = "#D97706";
  const emerald = "#059669";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", display: "flex", flexDirection: "column" }}>

      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: mode === "dark" ? "rgba(28, 25, 23, 0.85)" : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          px: { xs: 2, lg: 3 },
          py: 1.5,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1600, mx: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", px: "0 !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              background: primaryMain,
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Truck size={20} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.04em" }}>NORTHSTAR ELD</Typography>
              <Typography sx={{ fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", color: "text.secondary", mt: -0.2, letterSpacing: "0.02em" }}>FMCSA COMPLIANCE WORKSPACE</Typography>
            </Box>
          </Box>
          <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 3 }}>
            {liveDriverDetails && Object.values(liveDriverDetails).some(v => v) && (
              <Box sx={{ textAlign: "right", mr: 1 }}>
                <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", fontFamily: "'JetBrains Mono', monospace" }}>Driver</Typography>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>
                  {liveDriverDetails.driver_name || "Driver"}
                  {liveDriverDetails.tractor_number ? ` · Unit ${liveDriverDetails.tractor_number}` : ""}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton onClick={toggleColorMode} sx={{ color: "text.primary", transition: "transform 0.3s ease", "&:hover": { transform: "rotate(30deg)" } }}>
                {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </IconButton>
              <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)} sx={{ color: "text.primary", transition: "transform 0.3s ease", "&:hover": { transform: "rotate(90deg)" } }}>
                <Settings size={20} />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container component="main" maxWidth={false} sx={{ maxWidth: 1600, mx: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 3, p: { xs: 2, lg: 3 }, px: "16px !important" }}>

        <Box sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 3,
          alignItems: "stretch",
          animation: "fadeInUp 0.5s ease both",
          position: "relative",
          zIndex: spotlight ? 9999 : 1,
        }}>

          <Box sx={{ width: { xs: "100%", lg: 340 }, flexShrink: 0, display: "flex", flexDirection: "column", position: "relative", zIndex: spotlight ? 9999 : 1 }}>
            <Card sx={{ p: 2, borderRadius: 3, flex: 1, position: "relative", overflow: spotlight ? "visible" : "hidden", "&:hover": { boxShadow: mode === "light" ? "0 4px 12px rgba(28, 25, 23, 0.08)" : "0 4px 12px rgba(0, 0, 0, 0.4)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "primary.main" }}>Route parameters</Typography>
                  <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mt: 0.5 }}>Plan a compliant run</Typography>
                </Box>
                <IconButton onClick={handleReset} sx={{ bgcolor: primaryMuted, borderRadius: 2, transition: "all 0.2s ease", "&:hover": { bgcolor: primaryMuted, transform: "rotate(180deg)" } }}>
                  <RefreshCw size={18} color={primaryMain} />
                </IconButton>
              </Box>
              <TripForm onSubmit={handleSubmit} loading={loading} onDriverChange={setLiveDriverDetails} spotlight={spotlight} />
            </Card>
          </Box>

          <Card sx={{ flex: 1, borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 1.5, borderBottom: 1, borderColor: "divider", px: 2, py: 1.5, alignItems: { sm: "center" }, flexShrink: 0 }}>
              <Box>
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "primary.main" }}>
                  {result ? `Active route · ${(unit === "km" ? result.route.distance_miles * 1.60934 : result.route.distance_miles).toFixed(1)} ${unit}` : "Route map"}
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mt: 0.5, fontSize: "1.125rem" }}>
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

        <Card sx={{
          borderRadius: 3,
          animation: "fadeInUp 0.5s ease 0.1s both",
        }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, borderBottom: 1, borderColor: "divider", p: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
            <Box>
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "primary.main" }}>FMCSA daily log</Typography>
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mt: 0.5, fontSize: "1.125rem" }}>
                Duty status {result ? `· Day ${currentDay + 1} of ${result.daily_logs.length}` : ""}
              </Typography>
            </Box>
            {result && result.daily_logs.length > 0 && (
              <Box sx={{ display: "flex", overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 2.5, p: 0.5, bgcolor: "background.paper" }}>
                {result.daily_logs.map((_, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setCurrentDay(idx)}
                    sx={{
                      minWidth: "auto",
                      px: 2,
                      py: 0.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: 2,
                      color: currentDay === idx ? "primary.contrastText" : "text.secondary",
                      bgcolor: currentDay === idx ? "primary.main" : "transparent",
                      transition: "all 0.2s ease",
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
                <Box sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: primaryMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <ClipboardList size={28} color={mode === "dark" ? "#A8A29E" : "#78716C"} />
                </Box>
                <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "1rem", color: "text.primary" }}>No log sheet generated yet</Typography>
                <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", textAlign: "center", maxWidth: 380, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0.75, lineHeight: 2.2 }}>
                  Enter your route details and click 
                  <Box component="span" onClick={handleSpotlight} sx={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.75, bgcolor: primaryMain, color: theme.palette.primary.contrastText, borderRadius: 1.5, px: 1.25, py: 0.25, fontWeight: 600, fontSize: "0.75rem", fontFamily: "'Outfit', sans-serif", boxShadow: `0 2px 4px ${primaryMuted}`, transition: "transform 0.2s ease", "&:hover": { transform: "scale(1.05)" } }}>
                    <Route size={14} /> Plan Trip
                  </Box> 
                  to generate a fully compliant ELD daily log.
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        <Box sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          pb: 3,
          animation: "fadeInUp 0.5s ease 0.2s both",
        }}>

          <Card sx={{ p: 2, borderRadius: 3, flex: 1, "&:hover": { boxShadow: mode === "light" ? "0 4px 12px rgba(28, 25, 23, 0.08)" : "0 4px 12px rgba(0, 0, 0, 0.4)" } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "1.125rem" }}>Trip economics</Typography>
              <Box sx={{
                bgcolor: result ? "rgba(5, 150, 105, 0.12)" : primaryMuted,
                color: result ? emerald : "text.secondary",
                px: 1.5,
                py: 0.5,
                borderRadius: 6,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.625rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}>
                {result && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: emerald, animation: "dotPulse 2s ease infinite" }} />}
                {result ? "ACTIVE" : loading ? "CALCULATING" : "STANDBY"}
              </Box>
            </Box>
            {loading ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                {[0, 1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={72} />)}
              </Box>
            ) : result ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.5, transition: "all 0.2s ease", "&:hover": { borderColor: "primary.main", bgcolor: primaryMuted } }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", fontFamily: "'JetBrains Mono', monospace" }}>Distance</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "'JetBrains Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {(unit === "km" ? result.route.distance_miles * 1.60934 : result.route.distance_miles).toFixed(1)} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", textTransform: "lowercase" }}>{unit}</Typography>
                  </Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.5, transition: "all 0.2s ease", "&:hover": { borderColor: "primary.main", bgcolor: primaryMuted } }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", fontFamily: "'JetBrains Mono', monospace" }}>Drive time</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "'JetBrains Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {result.route.duration_hours.toFixed(1)} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>hrs</Typography>
                  </Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.5, transition: "all 0.2s ease", "&:hover": { borderColor: "primary.main", bgcolor: primaryMuted } }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", fontFamily: "'JetBrains Mono', monospace" }}>Required stops</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "'JetBrains Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {estimatedStops} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>stops</Typography>
                  </Typography>
                </Box>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, p: 1.5, transition: "all 0.2s ease", "&:hover": { borderColor: "primary.main", bgcolor: primaryMuted } }}>
                  <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", fontFamily: "'JetBrains Mono', monospace" }}>ETA</Typography>
                  <Typography sx={{ mt: 0.5, fontFamily: "'JetBrains Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}>
                    {estimatedEtaDays} <Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>days</Typography>
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: primaryMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={22} color={mode === "dark" ? "#A8A29E" : "#78716C"} />
                </Box>
                <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "text.primary" }}>Awaiting trip data</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center", maxWidth: 240 }}>
                  Distance, drive time, stops, and ETA will appear here after planning.
                </Typography>
              </Box>
            )}
          </Card>

          <Card sx={{ p: 2, borderRadius: 3, flex: 1, "&:hover": { boxShadow: mode === "light" ? "0 4px 12px rgba(28, 25, 23, 0.08)" : "0 4px 12px rgba(0, 0, 0, 0.4)" } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "1.125rem" }}>HOS guardrails</Typography>
              <Shield size={20} color={result ? emerald : (mode === "dark" ? "#A8A29E" : "#78716C")} />
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
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: "0.75rem" }}>{Number((result.daily_logs[0]?.totals.driving || 0).toFixed(1))}h / 11h</Typography>
                  </Box>
                  <Box sx={{ height: 6, bgcolor: "secondary.main", borderRadius: 3, overflow: "hidden" }}>
                    <Box sx={{
                      height: "100%",
                      width: `${Math.min(100, (result.daily_logs[0]?.totals.driving / 11) * 100)}%`,
                      bgcolor: emerald,
                      borderRadius: 3,
                      animation: "fillBar 0.8s ease both",
                    }} />
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>On-duty window</Typography>
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: "0.75rem" }}>{Number(((result.daily_logs[0]?.totals.driving || 0) + (result.daily_logs[0]?.totals.on_duty || 0)).toFixed(1))}h / 14h</Typography>
                  </Box>
                  <Box sx={{ height: 6, bgcolor: "secondary.main", borderRadius: 3, overflow: "hidden" }}>
                    <Box sx={{
                      height: "100%",
                      width: `${Math.min(100, ((result.daily_logs[0]?.totals.driving + result.daily_logs[0]?.totals.on_duty) / 14) * 100)}%`,
                      bgcolor: "primary.main",
                      borderRadius: 3,
                      animation: "fillBar 0.8s ease 0.2s both",
                    }} />
                  </Box>
                </Box>
                <Box sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  bgcolor: "rgba(5, 150, 105, 0.08)",
                  p: 1.5,
                  borderRadius: 2.5,
                  mt: 1,
                  border: "1px solid rgba(5, 150, 105, 0.15)",
                }}>
                  <CheckCircle2 size={16} color={emerald} style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "text.primary" }}>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>No violation predicted.</Typography> All breaks and rest periods are scheduled correctly.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: primaryMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={22} color={mode === "dark" ? "#A8A29E" : "#78716C"} />
                </Box>
                <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "text.primary" }}>Compliance check pending</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center", maxWidth: 240 }}>
                  HOS driving and on-duty window analysis will display after trip planning.
                </Typography>
              </Box>
            )}
          </Card>

        </Box>

      </Container>

      <Dialog 
        open={!!error} 
        onClose={() => setError(null)} 
        maxWidth="sm" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "error.main", pb: 1 }}>
          Route Error
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "'DM Sans', sans-serif", color: "text.primary" }}>
            {error}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setError(null)} 
            variant="contained" 
            sx={{ bgcolor: "error.main", "&:hover": { bgcolor: "error.dark" } }}
          >
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        slotProps={{ paper: { sx: { width: 300, mt: 1.5, borderRadius: 3, boxShadow: mode === "light" ? "0 4px 20px rgba(0,0,0,0.1)" : "0 4px 20px rgba(0,0,0,0.5)", border: 1, borderColor: "divider" } } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
          <Typography sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>App Settings</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><Monitor size={14} /> Theme Mode</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            {(["light", "dark", "system"] as ThemeMode[]).map(t => (
              <Button key={t} size="small" variant={themeMode === t ? "contained" : "outlined"} onClick={() => setThemeMode(t)} sx={{ flex: 1, p: 0.5, borderRadius: 2, textTransform: "capitalize", fontSize: "0.8rem", color: themeMode === t ? "primary.contrastText" : "text.primary", borderColor: "divider" }}>
                {t}
              </Button>
            ))}
          </Box>

          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><Palette size={14} /> Accent Color</Typography>
          <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
            {(["teal", "blue", "purple", "orange", "black"] as AccentColor[]).map(c => {
              const bg = c === "teal" ? "#14B8A6" : c === "blue" ? "#3B82F6" : c === "purple" ? "#8B5CF6" : c === "orange" ? "#F97316" : mode === "dark" ? "#FFFFFF" : "#000000";
              return (
                <Box key={c} onClick={() => setAccentColor(c)} sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", border: 2, borderColor: accentColor === c ? "text.primary" : "transparent", transition: "all 0.2s ease", "&:hover": { transform: "scale(1.1)" } }}>
                  {accentColor === c && <CheckCircle2 size={16} color={mode === "dark" && (c === "teal" || c === "black") ? "#0C0A09" : "#fff"} />}
                </Box>
              )
            })}
          </Box>

          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><Ruler size={14} /> Distance Unit</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            {(["mi", "km"] as Unit[]).map(u => (
              <Button key={u} size="small" variant={unit === u ? "contained" : "outlined"} onClick={() => setUnit(u)} sx={{ flex: 1, p: 0.5, borderRadius: 2, textTransform: "uppercase", fontSize: "0.8rem", color: unit === u ? "primary.contrastText" : "text.primary", borderColor: "divider" }}>
                {u}
              </Button>
            ))}
          </Box>
          
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><MapIcon size={14} /> Map Default Layer</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {(["osm", "satellite", "terrain"] as MapLayer[]).map(l => (
              <Button key={l} size="small" variant={mapLayer === l ? "contained" : "outlined"} onClick={() => setMapLayer(l)} sx={{ flex: 1, p: 0.5, borderRadius: 2, textTransform: "capitalize", fontSize: "0.7rem", color: mapLayer === l ? "primary.contrastText" : "text.primary", borderColor: "divider" }}>
                {l === "osm" ? "Standard" : l}
              </Button>
            ))}
          </Box>
        </Box>
      </Menu>

    </Box>
  );
}
