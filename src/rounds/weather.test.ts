import { describe, expect, it } from "vitest";
import { compassDirection, formatWeather } from "./weather";

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
    });
    expect(result).toBe("14°C · 3.2 m/s NW");
  });

  it("rounds temperature to the nearest whole degree", () => {
    const result = formatWeather({
      temperatureCelsius: -2.7,
      windSpeedMs: 0,
      windDirectionDegrees: 0,
    });
    expect(result).toBe("-3°C · 0.0 m/s N");
  });
});
