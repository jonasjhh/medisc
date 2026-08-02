import AcUnitIcon from "@mui/icons-material/AcUnit";
import CloudIcon from "@mui/icons-material/Cloud";
import GrainIcon from "@mui/icons-material/Grain";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import type SvgIcon from "@mui/material/SvgIcon";
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

// yr.no symbol codes look like "partlycloudy_day" / "lightrain" /
// "heavysnowshowersandthunder_night" — strip the light/night/twilight
// suffix, then bucket by keyword rather than enumerating all ~30 codes.
export function weatherIcon(symbolCode: string | null): typeof SvgIcon {
  if (!symbolCode) {
    return CloudIcon;
  }
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, "");
  if (base === "clearsky" || base === "fair") {
    return symbolCode.endsWith("_night") ? NightsStayIcon : WbSunnyIcon;
  }
  if (base.includes("thunder")) {
    return ThunderstormIcon;
  }
  if (base.includes("snow") || base.includes("sleet")) {
    return AcUnitIcon;
  }
  if (base.includes("rain")) {
    return GrainIcon;
  }
  return CloudIcon;
}

// wind_from_direction is where the wind is blowing FROM; rotate the arrow
// 180° so it visually points where the wind is blowing TO, which reads more
// intuitively at a glance than an arrow pointing "into" the wind.
export function windArrowRotation(windDirectionDegrees: number): number {
  return (windDirectionDegrees + 180) % 360;
}
