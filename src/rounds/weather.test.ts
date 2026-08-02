import { describe, expect, it } from "vitest";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import CloudIcon from "@mui/icons-material/Cloud";
import GrainIcon from "@mui/icons-material/Grain";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import {
  compassDirection,
  formatWeather,
  weatherIcon,
  windArrowRotation,
} from "./weather";

describe("compassDirection", () => {
  it("maps 0 degrees to N", () => {
    expect(compassDirection(0)).toBe("N");
  });

  it("maps 90 degrees to E", () => {
    expect(compassDirection(90)).toBe("E");
  });

  it("maps 315 degrees to NW", () => {
    expect(compassDirection(315)).toBe("NW");
  });

  it("wraps 360 degrees back to N", () => {
    expect(compassDirection(360)).toBe("N");
  });

  it("rounds to the nearest compass point", () => {
    expect(compassDirection(100)).toBe("E");
  });
});

describe("formatWeather", () => {
  it("formats temperature, wind speed, and direction", () => {
    const result = formatWeather({
      temperatureCelsius: 14.3,
      windSpeedMs: 3.2,
      windDirectionDegrees: 315,
      symbolCode: "partlycloudy_day",
    });
    expect(result).toBe("14°C · 3.2 m/s NW");
  });

  it("rounds temperature to the nearest whole degree", () => {
    const result = formatWeather({
      temperatureCelsius: -2.7,
      windSpeedMs: 0,
      windDirectionDegrees: 0,
      symbolCode: null,
    });
    expect(result).toBe("-3°C · 0.0 m/s N");
  });
});

describe("weatherIcon", () => {
  it("falls back to a cloud icon when there's no symbol code", () => {
    expect(weatherIcon(null)).toBe(CloudIcon);
  });

  it("uses a sun icon for clear/fair skies during the day", () => {
    expect(weatherIcon("clearsky_day")).toBe(WbSunnyIcon);
    expect(weatherIcon("fair_day")).toBe(WbSunnyIcon);
  });

  it("uses a moon icon for clear/fair skies at night", () => {
    expect(weatherIcon("clearsky_night")).toBe(NightsStayIcon);
  });

  it("uses a cloud icon for cloudy/partly cloudy conditions", () => {
    expect(weatherIcon("cloudy")).toBe(CloudIcon);
    expect(weatherIcon("partlycloudy_day")).toBe(CloudIcon);
  });

  it("uses a rain icon for rain, including showers", () => {
    expect(weatherIcon("rain")).toBe(GrainIcon);
    expect(weatherIcon("lightrainshowers_day")).toBe(GrainIcon);
  });

  it("uses a snow icon for snow and sleet", () => {
    expect(weatherIcon("snow")).toBe(AcUnitIcon);
    expect(weatherIcon("sleet")).toBe(AcUnitIcon);
  });

  it("uses a thunderstorm icon for anything with thunder", () => {
    expect(weatherIcon("heavyrainandthunder")).toBe(ThunderstormIcon);
  });
});

describe("windArrowRotation", () => {
  it("points a north wind toward south (180deg)", () => {
    expect(windArrowRotation(0)).toBe(180);
  });

  it("points an east wind toward west (270deg)", () => {
    expect(windArrowRotation(90)).toBe(270);
  });

  it("wraps past 360 back toward 0", () => {
    expect(windArrowRotation(270)).toBe(90);
  });
});
