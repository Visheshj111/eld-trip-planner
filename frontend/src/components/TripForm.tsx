import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import { MapPin, Truck, Zap } from "lucide-react";
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
      newErrors.cycleHours = "0 - 70 hours";
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
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>Current location</Typography>
        <TextField
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
          error={!!errors.currentLocation}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MapPin size={16} color="#2563EB" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>Pickup location</Typography>
        <TextField
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          error={!!errors.pickupLocation}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box sx={{ w: 10, h: 10, borderRadius: "50%", bgcolor: "#10B981", ml: 0.5, mr: 1 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>Dropoff location</Typography>
        <TextField
          value={dropoffLocation}
          onChange={(e) => setDropoffLocation(e.target.value)}
          error={!!errors.dropoffLocation}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box sx={{ w: 10, h: 10, borderRadius: "50%", bgcolor: "#EF4444", ml: 0.5, mr: 1 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, mt: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>Current cycle used</Typography>
            <Typography sx={{ fontSize: "0.6875rem", color: "text.secondary" }}>Rolling 70 hr / 8 day window</Typography>
          </Box>
          <TextField
            value={cycleHours}
            onChange={(e) => setCycleHours(e.target.value)}
            error={!!errors.cycleHours}
            size="small"
            type="number"
            sx={{ width: 80, "& .MuiInputBase-root": { fontSize: "0.875rem", fontFamily: "monospace", fontWeight: 700, color: "primary.main" } }}
            inputProps={{ style: { textAlign: "right", padding: "4px 8px" }, step: "0.1", min: "0", max: "70" }}
          />
        </Box>
        <Box sx={{ height: 8, bgcolor: "secondary.main", borderRadius: 4, overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: cycleHours ? `${(parseFloat(cycleHours) / 70) * 100}%` : "0%", bgcolor: "primary.main" }} />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5, fontFamily: "monospace", fontSize: "0.625rem", color: "text.secondary" }}>
          <Typography component="span" sx={{ fontSize: "inherit" }}>0</Typography>
          <Typography component="span" sx={{ fontSize: "inherit" }}>35</Typography>
          <Typography component="span" sx={{ fontSize: "inherit" }}>70</Typography>
        </Box>
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Zap size={18} />}
        sx={{ mt: 1, height: 48 }}
      >
        {loading ? "Generating..." : "Generate compliant route"}
      </Button>

      <Button variant="text" onClick={fillTestValues} sx={{ fontSize: "0.625rem", color: "text.secondary", mt: -1 }}>
        Fill Test Data
      </Button>
    </Box>
  );
}
