import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import { MapPin, Zap, Navigation, Flag } from "lucide-react";
import type { TripRequest } from "../api/types";

interface TripFormProps {
  onSubmit: (data: TripRequest) => void;
  loading: boolean;
}

export default function TripForm({ onSubmit, loading }: TripFormProps) {
  const [currentLocation, setCurrentLocation] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [cycleHours, setCycleHours] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentLocation.trim()) newErrors.currentLocation = "Required";
    if (!pickupLocation.trim()) newErrors.pickupLocation = "Required";
    if (!dropoffLocation.trim()) newErrors.dropoffLocation = "Required";

    const hours = parseFloat(cycleHours);
    if (isNaN(hours) || hours < 0 || hours > 70) {
      newErrors.cycleHours = "Must be 0-70";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      current_location: currentLocation.trim(),
      pickup_location: pickupLocation.trim(),
      dropoff_location: dropoffLocation.trim(),
      current_cycle_used: parseFloat(cycleHours),
    });
  };

  const fillTestValues = () => {
    setCurrentLocation("Gary, IN");
    setPickupLocation("Chicago Freight Hub, IL");
    setDropoffLocation("Dallas Distribution Center, TX");
    setCycleHours("42.5");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Locations Section with visual connector */}
      <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Connector Line */}
        <Box sx={{ position: "absolute", left: 15, top: 24, bottom: 24, width: 2, bgcolor: "divider", zIndex: 0 }} />

        {/* Current Location */}
        <Box sx={{ display: "flex", gap: 1.5, position: "relative", zIndex: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "primary.light", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.5, border: "2px solid white" }}>
            <Navigation size={16} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, mb: 0.5 }}>Current location</Typography>
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
          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#D1FAE5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.5, border: "2px solid white" }}>
            <MapPin size={16} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, mb: 0.5 }}>Pickup location</Typography>
            <TextField
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g. Chicago Freight Hub, IL"
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
          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#FEE2E2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.5, border: "2px solid white" }}>
            <Flag size={16} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, mb: 0.5 }}>Dropoff location</Typography>
            <TextField
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              placeholder="e.g. Dallas Distribution Center, TX"
              error={!!errors.dropoffLocation}
              helperText={errors.dropoffLocation}
              fullWidth
              size="small"
              sx={{ bgcolor: "background.paper" }}
            />
          </Box>
        </Box>
      </Box>

      {/* Cycle Hours Section */}
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
            sx={{ width: 100, "& .MuiInputBase-root": { fontSize: "0.875rem", fontFamily: "monospace", fontWeight: 700, color: "primary.main", bgcolor: "background.paper" }, "& input": { textAlign: "right", padding: "6px 10px" } }}
            slotProps={{
              htmlInput: { step: "0.1", min: "0", max: "70" },
              input: {
                endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" }}>hr</Typography></InputAdornment>
              }
            }}
          />
        </Box>
        <Box sx={{ height: 6, bgcolor: "divider", borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: cycleHours ? `${Math.min(100, (parseFloat(cycleHours) / 70) * 100)}%` : "0%", bgcolor: "primary.main", transition: "width 0.3s ease" }} />
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
          {loading ? "Generating..." : "Plan Trip"}
        </Button>
        <Button variant="text" onClick={fillTestValues} sx={{ fontSize: "0.6875rem", color: "text.secondary", textTransform: "none" }}>
          Fill with test data
        </Button>
      </Box>
    </Box>
  );
}
