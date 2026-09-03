import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import { MapPin, Zap, Navigation, Flag, User, ChevronDown, ChevronUp, Truck, Hash } from "lucide-react";
import type { TripRequest, DriverDetails } from "../api/types";

interface TripFormProps {
  onSubmit: (data: TripRequest) => void;
  loading: boolean;
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
  border: "2px solid white",
} as const;

export default function TripForm({ onSubmit, loading }: TripFormProps) {
  const [currentLocation, setCurrentLocation] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [cycleHours, setCycleHours] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [driverOpen, setDriverOpen] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [tractorNumber, setTractorNumber] = useState("");
  const [trailerNumber, setTrailerNumber] = useState("");

  const hasDriverInfo = !!(driverName || carrierName || tractorNumber || trailerNumber);

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
    if (!validate()) return;

    const driver_details: DriverDetails = {
      driver_name: driverName.trim(),
      carrier_name: carrierName.trim(),
      tractor_number: tractorNumber.trim(),
      trailer_number: trailerNumber.trim(),
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
    setDriverName("Marcus J. Wheeler");
    setCarrierName("NorthStar Freight Co.");
    setTractorNumber("4821-A");
    setTrailerNumber("TRL-9042");
    setDriverOpen(true);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── Route Locations ─────────────────────────────────── */}
      <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Connector line */}
        <Box sx={{ position: "absolute", left: 15, top: 24, bottom: 24, width: 2, bgcolor: "divider", zIndex: 0 }} />

        {/* Current Location */}
        <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
          <Box sx={{ ...ICON_CIRCLE_BASE, bgcolor: "primary.light", color: "primary.main" }}>
            <Navigation size={16} />
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

        {/* Pickup Location */}
        <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
          <Box sx={{ ...ICON_CIRCLE_BASE, bgcolor: "#D1FAE5", color: "#10B981" }}>
            <MapPin size={16} />
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

        {/* Dropoff Location */}
        <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
          <Box sx={{ ...ICON_CIRCLE_BASE, bgcolor: "#FEE2E2", color: "#EF4444" }}>
            <Flag size={16} />
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

      {/* ── Cycle Hours ─────────────────────────────────────── */}
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2, bgcolor: "secondary.light" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Current cycle used</Typography>
            <Typography sx={{ fontSize: "0.6875rem", color: "text.secondary", mt: 0.25 }}>70 hr / 8 day window</Typography>
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
              width: 100,
              "& .MuiInputBase-root": { fontSize: "0.875rem", fontFamily: "monospace", fontWeight: 700, color: "primary.main", bgcolor: "background.paper" },
              "& input": { textAlign: "right", padding: "6px 10px" },
            }}
            slotProps={{
              htmlInput: { step: "0.1", min: "0", max: "70" },
              input: {
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
              bgcolor: parseFloat(cycleHours) > 60 ? "#F59E0B" : "primary.main",
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
          />
        </Box>
      </Box>

      {/* ── Driver Details (collapsible) ─────────────────────── */}
      <Box
        sx={{
          border: 1,
          borderColor: driverOpen ? "primary.main" : "divider",
          borderRadius: 2,
          overflow: "hidden",
          transition: "border-color 0.2s ease",
        }}
      >
        {/* Header toggle */}
        <Box
          onClick={() => setDriverOpen((o) => !o)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.25,
            cursor: "pointer",
            bgcolor: driverOpen ? "primary.main" : "secondary.light",
            transition: "background-color 0.2s ease",
            userSelect: "none",
            "&:hover": { bgcolor: driverOpen ? "primary.dark" : "secondary.main" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <User size={15} color={driverOpen ? "#fff" : "#2563EB"} />
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: driverOpen ? "#fff" : "text.primary",
                letterSpacing: "0.03em",
              }}
            >
              Driver &amp; carrier details
            </Typography>
            {hasDriverInfo && !driverOpen && (
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "#fff",
                  borderRadius: "10px",
                  px: 0.75,
                  py: 0.1,
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  lineHeight: 1.6,
                }}
              >
                FILLED
              </Box>
            )}
          </Box>
          <Box sx={{ color: driverOpen ? "#fff" : "text.secondary", display: "flex" }}>
            {driverOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Box>
        </Box>

        <Collapse in={driverOpen}>
          <Box sx={{ px: 2, py: 2, bgcolor: "background.paper", display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Driver Name + Carrier Name */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <User size={12} color="#64748B" />
                  <Typography sx={{ ...FIELD_LABEL_SX, mb: 0 }}>Driver name</Typography>
                </Box>
                <TextField
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Full name"
                  fullWidth
                  size="small"
                />
              </Box>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Truck size={12} color="#64748B" />
                  <Typography sx={{ ...FIELD_LABEL_SX, mb: 0 }}>Carrier name</Typography>
                </Box>
                <TextField
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  placeholder="Company name"
                  fullWidth
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ borderStyle: "dashed" }} />

            {/* Tractor # + Trailer # */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Hash size={12} color="#64748B" />
                  <Typography sx={{ ...FIELD_LABEL_SX, mb: 0 }}>Tractor #</Typography>
                </Box>
                <TextField
                  value={tractorNumber}
                  onChange={(e) => setTractorNumber(e.target.value)}
                  placeholder="e.g. 4821-A"
                  fullWidth
                  size="small"
                  slotProps={{ input: { sx: { fontFamily: "monospace", fontWeight: 600, fontSize: "0.8125rem" } } }}
                />
              </Box>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Hash size={12} color="#64748B" />
                  <Typography sx={{ ...FIELD_LABEL_SX, mb: 0 }}>Trailer #</Typography>
                </Box>
                <TextField
                  value={trailerNumber}
                  onChange={(e) => setTrailerNumber(e.target.value)}
                  placeholder="e.g. TRL-9042"
                  fullWidth
                  size="small"
                  slotProps={{ input: { sx: { fontFamily: "monospace", fontWeight: 600, fontSize: "0.8125rem" } } }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 1.5,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography sx={{ fontSize: "0.6875rem", color: "#1D4ED8", lineHeight: 1.5 }}>
                These details will appear on every generated log sheet — leave blank to omit.
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* ── Actions ─────────────────────────────────────────── */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Zap size={18} />}
          sx={{ height: 48, fontWeight: 600, fontSize: "0.9375rem" }}
        >
          {loading ? "Generating…" : "Plan Trip"}
        </Button>
        <Button
          variant="text"
          onClick={fillTestValues}
          sx={{ fontSize: "0.6875rem", color: "text.secondary", textTransform: "none" }}
        >
          Fill with test data
        </Button>
      </Box>
    </Box>
  );
}
