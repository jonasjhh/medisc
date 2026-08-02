import type { RoundWeather } from "./api";

const COMPASS_POINTS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

export function compassDirection(degrees: number): string {
  const index = Math.round(degrees / 22.5) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index];
}

export function formatWeather(weather: RoundWeather): string {
  const temperature = Math.round(weather.temperatureCelsius);
  const windSpeed = weather.windSpeedMs.toFixed(1);
  const direction = compassDirection(weather.windDirectionDegrees);
  return `${temperature}°C · ${windSpeed} m/s ${direction}`;
}
