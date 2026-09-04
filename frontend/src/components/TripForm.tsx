import { useState, useEffect } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Divider from "@mui/material/Divider";
import { MapPin, Route, Navigation, Flag, User, ChevronDown, ChevronUp, Truck, Hash, Home, Package, FileText, ClipboardList, CheckCircle2 } from "lucide-react";
import type { TripRequest, DriverDetails } from "../api/types";

interface TripFormProps {
  onSubmit: (data: TripRequest) => void;
  loading: boolean;
  onDriverChange?: (details: DriverDetails) => void;
  spotlight?: boolean;
}

const FIELD_LABEL_SX = { fontSize: "0.75rem", fontWeight: 600, mb: 0.5 } as const;
const ICON_CIRCLE_BASE = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  mt: 0.5,
  border: "2px solid",
  borderColor: "background.paper",
} as const;

const LOADING_MESSAGES = [
  "Fueling up the rig...",
  "Checking tire pressure...",
  "Recalculating route...",
  "Consulting the atlas...",
  "Finding the best truck stops...",
  "Washing the windshield...",
  "Brewing trucker coffee...",
  "Tuning the CB radio...",
  "Loading the trailer...",
  "Securing the cargo...",
  "Checking the mirrors...",
  "Avoiding low bridges...",
  "Negotiating with dispatch...",
  "Warming up the diesel engine...",
  "Plotting course...",
  "Calculating hours of service...",
  "Shifting gears...",
  "Planning the next break...",
  "Mapping out the journey...",
  "Logging duty status...",
  "Synchronizing logs...",
  "Reviewing FMCSA regulations...",
  "Preparing the manifest...",
  "Optimizing fuel stops...",
  "Getting the green light...",
  "Doing the pre-trip inspection...",
  "Navigating city streets...",
  "Hitting the open road...",
  "Blowing the air horn..."
];

export default function TripForm({ onSubmit, loading, onDriverChange, spotlight }: TripFormProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [currentLocation, setCurrentLocation] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [cycleHours, setCycleHours] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    if (!loading) {
      setLoadingText(LOADING_MESSAGES[0]);
      return;
    }
    
    let currentIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
    setLoadingText(LOADING_MESSAGES[currentIndex]);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
      setLoadingText(LOADING_MESSAGES[currentIndex]);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [loading]);

  const [expandedPanel, setExpandedPanel] = useState<string>("route");

  const [driverName, setDriverName] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [homeTerminal, setHomeTerminal] = useState("");

  const [carrierName, setCarrierName] = useState("");
  const [tractorNumber, setTractorNumber] = useState("");
  const [trailerNumber, setTrailerNumber] = useState("");

  const [shipper, setShipper] = useState("");
  const [commodity, setCommodity] = useState("");
  const [loadNumber, setLoadNumber] = useState("");

  const hasRouteInfo = !!(currentLocation && pickupLocation && dropoffLocation && cycleHours);
  const hasDriverInfo = !!(driverName || driverNumber || homeTerminal || carrierName || tractorNumber || trailerNumber || shipper || commodity || loadNumber);

  useEffect(() => {
    onDriverChange?.({
      driver_name: driverName,
      driver_number: driverNumber,
      home_terminal: homeTerminal,
      carrier_name: carrierName,
      tractor_number: tractorNumber,
      trailer_number: trailerNumber,
      shipper,
      commodity,
      load_number: loadNumber,
    });
  }, [driverName, driverNumber, homeTerminal, carrierName, tractorNumber, trailerNumber, shipper, commodity, loadNumber, onDriverChange]);

  const primaryMain = theme.palette.primary.main;
  const primaryMuted = alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08);
  const emerald = "#059669";
  const emeraldBg = isDark ? "rgba(5, 150, 105, 0.2)" : "rgba(5, 150, 105, 0.08)";

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentLocation.trim()) newErrors.currentLocation = "Required";
    if (!pickupLocation.trim()) newErrors.pickupLocation = "Required";
    if (!dropoffLocation.trim()) newErrors.dropoffLocation = "Required";
    const hours = parseFloat(cycleHours);
    if (isNaN(hours) || hours < 0 || hours > 70) {
      newErrors.cycleHours = "Must be 0–70";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setExpandedPanel("route");
      return;
    }

    const driver_details: DriverDetails = {
      driver_name: driverName.trim(),
      driver_number: driverNumber.trim(),
      home_terminal: homeTerminal.trim(),
      carrier_name: carrierName.trim(),
      tractor_number: tractorNumber.trim(),
      trailer_number: trailerNumber.trim(),
      shipper: shipper.trim(),
      commodity: commodity.trim(),
      load_number: loadNumber.trim(),
    };

    onSubmit({
      current_location: currentLocation.trim(),
      pickup_location: pickupLocation.trim(),
      dropoff_location: dropoffLocation.trim(),
      current_cycle_used: parseFloat(cycleHours),
      driver_details,
    });
  };

  const fillTestValues = () => {
    setCurrentLocation("Gary, IN");
    setPickupLocation("Chicago, IL");
    setDropoffLocation("Dallas, TX");
    setCycleHours("42.5");

    setDriverName("Alex Rivera");
    setDriverNumber("ID-99382");
    setHomeTerminal("Omaha, NE");

    setCarrierName("Horizon Freight LLC");
    setTractorNumber("7734");
    setTrailerNumber("HZ-4221");

    setShipper("Acme Logistics");
    setCommodity("Widgets and Gizmos");
    setLoadNumber("LD-83921102");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      <Accordion
        expanded={expandedPanel === "route"}
        onChange={(e, isExpanded) => setExpandedPanel(isExpanded ? "route" : "")}
        elevation={0}
        sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" }, borderRadius: "12px !important", transition: "border-color 0.2s ease", "&:hover": { borderColor: isDark ? "#44403C" : "#D6D3D1" } }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "1rem", fontWeight: 700, color: "text.primary" }}>Plan a compliant run</Typography>
            {hasRouteInfo && expandedPanel !== "route" && (
              <CheckCircle2 size={16} color={emerald} />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <Box sx={{ ...ICON_CIRCLE_BASE, bgcolor: primaryMuted, color: primaryMain }}>
                  <Navigation size={16} />
                </Box>
                <Box sx={{ position: "absolute", top: 40, bottom: -16, width: 2, bgcolor: "divider", zIndex: 0 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={FIELD_LABEL_SX}>Current location</Typography>
                <TextField
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g. Gary, IN"
                  error={!!errors.currentLocation}
                  helperText={errors.currentLocation}
                  fullWidth
                  size="small"
                  sx={{ bgcolor: "background.paper" }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <Box sx={{ ...ICON_CIRCLE_BASE, bgcolor: emeraldBg, color: emerald }}>
                  <MapPin size={16} />
                </Box>
                <Box sx={{ position: "absolute", top: 40, bottom: -16, width: 2, bgcolor: "divider", zIndex: 0 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={FIELD_LABEL_SX}>Pickup location</Typography>
                <TextField
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Chicago, IL"
                  error={!!errors.pickupLocation}
                  helperText={errors.pickupLocation}
                  fullWidth
                  size="small"
                  sx={{ bgcolor: "background.paper" }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <Box sx={{ ...ICON_CIRCLE_BASE, bgcolor: isDark ? "rgba(220, 38, 38, 0.2)" : "rgba(220, 38, 38, 0.08)", color: "#DC2626" }}>
                  <Flag size={16} />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={FIELD_LABEL_SX}>Dropoff location</Typography>
                <TextField
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="e.g. Dallas, TX"
                  error={!!errors.dropoffLocation}
                  helperText={errors.dropoffLocation}
                  fullWidth
                  size="small"
                  sx={{ bgcolor: "background.paper" }}
                />
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expandedPanel === "details"}
        onChange={(e, isExpanded) => setExpandedPanel(isExpanded ? "details" : "")}
        elevation={0}
        sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" }, borderRadius: "12px !important", transition: "border-color 0.2s ease", "&:hover": { borderColor: isDark ? "#44403C" : "#D6D3D1" } }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "1rem", fontWeight: 700, color: "text.primary" }}>Log Sheet Details</Typography>
            {hasDriverInfo && expandedPanel !== "details" && (
              <CheckCircle2 size={16} color={emerald} />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="Driver Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Full name" fullWidth size="small" variant="filled" />
              <TextField label="Driver ID" value={driverNumber} onChange={(e) => setDriverNumber(e.target.value)} placeholder="e.g. 1224213" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "'JetBrains Mono', monospace" } } }} />
            </Box>

            <TextField label="Main Office / Home Terminal" value={homeTerminal} onChange={(e) => setHomeTerminal(e.target.value)} placeholder="e.g. Green Bay, WI" fullWidth size="small" variant="filled" />

            <TextField label="Carrier Name" value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="e.g. Schneider National Carriers, Inc." fullWidth size="small" variant="filled" />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="Tractor Unit #" value={tractorNumber} onChange={(e) => setTractorNumber(e.target.value)} placeholder="e.g. 48872" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "'JetBrains Mono', monospace" } } }} />
              <TextField label="Trailer Unit #" value={trailerNumber} onChange={(e) => setTrailerNumber(e.target.value)} placeholder="e.g. TA939200" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "'JetBrains Mono', monospace" } } }} />
            </Box>

            <TextField label="Shipper" value={shipper} onChange={(e) => setShipper(e.target.value)} placeholder="e.g. Don's Paper Co." fullWidth size="small" variant="filled" />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} placeholder="e.g. Paper products" fullWidth size="small" variant="filled" />
              <TextField label="Load Number" value={loadNumber} onChange={(e) => setLoadNumber(e.target.value)} placeholder="e.g. ST13241564114" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "'JetBrains Mono', monospace" } } }} />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 3, p: 2, bgcolor: "secondary.light" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Current cycle used</Typography>
            <Typography sx={{ fontSize: "0.6875rem", color: "text.secondary", mt: 0.25, fontFamily: "'JetBrains Mono', monospace" }}>70 hr / 8 day window</Typography>
          </Box>
          <TextField
            value={cycleHours}
            onChange={(e) => setCycleHours(e.target.value)}
            error={!!errors.cycleHours}
            helperText={errors.cycleHours}
            placeholder="0.0"
            size="small"
            type="number"
            sx={{
              width: 120,
              "& .MuiInputBase-root": { fontSize: "0.875rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "primary.main", bgcolor: "background.paper" },
              "& input": { textAlign: "right", padding: "6px 10px" },
              "& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
              "& input[type=number]": { MozAppearance: "textfield" },
            }}
            slotProps={{
              htmlInput: { step: "0.1", min: "0", max: "70" },
              input: {
                sx: { bgcolor: primaryMuted, borderRadius: 2, color: primaryMain },
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" }}>hr</Typography>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Box sx={{ height: 6, bgcolor: "divider", borderRadius: 3, overflow: "hidden" }}>
          <Box
            sx={{
              height: "100%",
              width: cycleHours ? `${Math.min(100, (parseFloat(cycleHours) / 70) * 100)}%` : "0%",
              bgcolor: parseFloat(cycleHours) > 60 ? "#D97706" : "primary.main",
              transition: "width 0.3s ease, background-color 0.3s ease",
              borderRadius: 3,
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Button
          id="plan-trip-btn"
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Route size={18} />}
          sx={{
            position: "relative",
            zIndex: spotlight ? 9999 : 1,
            boxShadow: spotlight ? "0 0 0 9999px rgba(0,0,0,0.6)" : undefined,
            height: 48,
            fontWeight: 600,
            fontSize: "0.9375rem",
            fontFamily: "'Outfit', sans-serif",
            background: loading ? undefined : primaryMain,
            color: "primary.contrastText",
            transition: "all 0.25s ease",
            "&:hover": {
              background: alpha(primaryMain, 0.9),
              transform: "translateY(-2px)",
            },
            "&:active": {
              transform: "translateY(0px)",
            },
          }}
        >
          {loading ? loadingText : "Plan Trip"}
        </Button>
        <Button
          variant="text"
          onClick={fillTestValues}
          sx={{ fontSize: "0.6875rem", color: "text.secondary", textTransform: "none", "&:hover": { color: "primary.main" } }}
        >
          Fill with test data
        </Button>
      </Box>
    </Box>
  );
}
