import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { updateRound } from "./api";
import type { RoundDetail } from "./api";
import { compassDirection, weatherIcon } from "./weather";
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "../shared/formatDateTime";

// A curated subset of yr.no's ~30 symbol codes, one per icon bucket that
// weatherIcon() actually distinguishes (src/rounds/weather.ts) — clearsky
// and fair each get a night variant since those are the only two buckets
// where the icon differs by day/night; everything else renders the same
// icon regardless, so one entry covers it.
const CONDITIONS: { code: string; label: string }[] = [
  { code: "clearsky_day", label: "Clear sky" },
  { code: "fair_day", label: "Fair" },
  { code: "partlycloudy_day", label: "Partly cloudy" },
  { code: "cloudy", label: "Cloudy" },
  { code: "lightrain", label: "Light rain" },
  { code: "rain", label: "Rain" },
  { code: "heavyrain", label: "Heavy rain" },
  { code: "rainandthunder", label: "Thunderstorm" },
  { code: "lightsnow", label: "Light snow" },
  { code: "snow", label: "Snow" },
  { code: "sleet", label: "Sleet" },
  { code: "clearsky_night", label: "Clear sky (night)" },
  { code: "fair_night", label: "Fair (night)" },
];

export function EditRoundDetailsDialog({
  open,
  onClose,
  round,
  onRoundUpdated,
}: {
  open: boolean;
  onClose: () => void;
  round: RoundDetail;
  onRoundUpdated: (round: RoundDetail) => void;
}) {
  const [createdAt, setCreatedAt] = useState("");
  const [temperature, setTemperature] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [windDirection, setWindDirection] = useState("");
  const [condition, setCondition] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCreatedAt(toDateTimeLocalValue(round.createdAt));
    if (round.weather) {
      setTemperature(String(round.weather.temperatureCelsius));
      setWindSpeed(String(round.weather.windSpeedMs));
      setWindDirection(String(round.weather.windDirectionDegrees));
      setCondition(round.weather.symbolCode ?? "");
    } else {
      setTemperature("");
      setWindSpeed("");
      setWindDirection("");
      setCondition("");
    }
    setError(null);
  }, [open, round]);

  const weatherFieldsFilled =
    temperature !== "" &&
    windSpeed !== "" &&
    windDirection !== "" &&
    condition !== "";
  const weatherFieldsEmpty =
    temperature === "" &&
    windSpeed === "" &&
    windDirection === "" &&
    condition === "";

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateRound(round.id, {
        createdAt: fromDateTimeLocalValue(createdAt),
        ...(weatherFieldsFilled
          ? {
              weather: {
                temperatureCelsius: Number(temperature),
                windSpeedMs: Number(windSpeed),
                windDirectionDegrees: Number(windDirection),
                symbolCode: condition,
              },
            }
          : {}),
      });
      onRoundUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const directionNumber = Number(windDirection);
  const directionHelperText =
    windDirection !== "" && !Number.isNaN(directionNumber)
      ? `From the ${compassDirection(directionNumber)}`
      : " ";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit round details</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Date & time"
            type="datetime-local"
            value={createdAt}
            onChange={(event) => setCreatedAt(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField
            label="Temperature (°C)"
            type="number"
            value={temperature}
            onChange={(event) => setTemperature(event.target.value)}
            fullWidth
          />
          <TextField
            label="Wind speed (m/s)"
            type="number"
            value={windSpeed}
            onChange={(event) => setWindSpeed(event.target.value)}
            slotProps={{ htmlInput: { min: 0 } }}
            fullWidth
          />
          <TextField
            label="Wind direction (°)"
            type="number"
            value={windDirection}
            onChange={(event) => setWindDirection(event.target.value)}
            helperText={directionHelperText}
            slotProps={{ htmlInput: { min: 0, max: 360 } }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="round-condition-label">Condition</InputLabel>
            <Select
              labelId="round-condition-label"
              label="Condition"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
            >
              {CONDITIONS.map(({ code, label }) => {
                const Icon = weatherIcon(code);
                return (
                  <MenuItem key={code} value={code}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Icon fontSize="small" />
                      <span>{label}</span>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {!weatherFieldsFilled && !weatherFieldsEmpty && (
            <FormHelperText>
              Fill in all four weather fields to save weather, or clear all of
              them to leave weather unchanged.
            </FormHelperText>
          )}
          {error && <FormHelperText error>{error}</FormHelperText>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || (!weatherFieldsFilled && !weatherFieldsEmpty)}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
