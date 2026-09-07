import NavigationIcon from "@mui/icons-material/Navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { RoundWeather } from "./api";
import { formatWeather, weatherIcon, windArrowRotation } from "./weather";

export function RoundWeatherBadge({ weather }: { weather: RoundWeather }) {
  const WeatherIcon = weatherIcon(weather.symbolCode);
  return (
    <Stack
      component="span"
      direction="row"
      spacing={0.5}
      alignItems="center"
      aria-label={formatWeather(weather)}
    >
      <WeatherIcon
        aria-hidden="true"
        sx={{ fontSize: 14, color: "text.secondary" }}
      />
      <Typography component="span" variant="caption" color="text.secondary">
        {Math.round(weather.temperatureCelsius)}°C
      </Typography>
      <NavigationIcon
        aria-hidden="true"
        sx={{
          fontSize: 14,
          color: "text.secondary",
          transform: `rotate(${windArrowRotation(weather.windDirectionDegrees)}deg)`,
        }}
      />
      <Typography component="span" variant="caption" color="text.secondary">
        {weather.windSpeedMs.toFixed(1)} m/s
      </Typography>
    </Stack>
  );
}
