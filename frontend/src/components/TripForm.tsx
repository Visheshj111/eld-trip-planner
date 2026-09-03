import { useState } from "react";
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
import { MapPin, Zap, Navigation, Flag, User, ChevronDown, ChevronUp, Truck, Hash, Home, Package, FileText, ClipboardList, CheckCircle2 } from "lucide-react";
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
    
    setDriverName("Yosef Smith");
    setDriverNumber("1224213");
    setHomeTerminal("Green Bay, WI");
    
    setCarrierName("Schneider National Carriers, Inc.");
    setTractorNumber("48872");
    setTrailerNumber("TA939200");
    
    setShipper("Don's Paper Co.");
    setCommodity("Paper products");
    setLoadNumber("ST13241564114");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      <Accordion 
        expanded={expandedPanel === "route"} 
        onChange={(e, isExpanded) => setExpandedPanel(isExpanded ? "route" : "")}
        elevation={0}
        sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" }, borderRadius: "12px !important" }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "text.primary" }}>Plan a compliant run</Typography>
            {hasRouteInfo && expandedPanel !== "route" && (
              <CheckCircle2 size={16} color="#10B981" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ position: "absolute", left: 15, top: 24, bottom: 24, width: 2, bgcolor: "divider", zIndex: 0 }} />

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
        </AccordionDetails>
      </Accordion>

      <Accordion 
        expanded={expandedPanel === "details"} 
        onChange={(e, isExpanded) => setExpandedPanel(isExpanded ? "details" : "")}
        elevation={0}
        sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" }, borderRadius: "12px !important" }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "text.primary" }}>Log Sheet Details</Typography>
            {hasDriverInfo && expandedPanel !== "details" && (
              <CheckCircle2 size={16} color="#10B981" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="Driver Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Full name" fullWidth size="small" variant="filled" />
              <TextField label="Driver ID" value={driverNumber} onChange={(e) => setDriverNumber(e.target.value)} placeholder="e.g. 1224213" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "monospace" } } }} />
            </Box>
            
            <TextField label="Main Office / Home Terminal" value={homeTerminal} onChange={(e) => setHomeTerminal(e.target.value)} placeholder="e.g. Green Bay, WI" fullWidth size="small" variant="filled" />

            <TextField label="Carrier Name" value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="e.g. Schneider National Carriers, Inc." fullWidth size="small" variant="filled" />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="Tractor Unit #" value={tractorNumber} onChange={(e) => setTractorNumber(e.target.value)} placeholder="e.g. 48872" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "monospace" } } }} />
              <TextField label="Trailer Unit #" value={trailerNumber} onChange={(e) => setTrailerNumber(e.target.value)} placeholder="e.g. TA939200" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "monospace" } } }} />
            </Box>

            <TextField label="Shipper" value={shipper} onChange={(e) => setShipper(e.target.value)} placeholder="e.g. Don's Paper Co." fullWidth size="small" variant="filled" />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} placeholder="e.g. Paper products" fullWidth size="small" variant="filled" />
              <TextField label="Load Number" value={loadNumber} onChange={(e) => setLoadNumber(e.target.value)} placeholder="e.g. ST13241564114" fullWidth size="small" variant="filled" slotProps={{ input: { sx: { fontFamily: "monospace" } } }} />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

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
