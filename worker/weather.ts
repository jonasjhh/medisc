// MET Norway requires a descriptive User-Agent identifying the app and a
// contact point, or it returns 403 instead of throttling. Coordinates are
// capped at 4 decimals per their docs; requests with more are rejected.
const USER_AGENT = "Medisc/1.0 (+https://github.com/jonasjhh/medisc)";
const FETCH_TIMEOUT_MS = 3000;

export interface Weather {
  temperatureCelsius: number;
  windSpeedMs: number;
  windDirectionDegrees: number;
}

interface LocationforecastResponse {
  properties?: {
    timeseries?: {
      data?: {
        instant?: {
          details?: {
            air_temperature?: number;
            wind_speed?: number;
            wind_from_direction?: number;
          };
        };
      };
    }[];
  };
}

// Best effort: creating a round must never fail or stall because the
// weather API is slow or unreachable, so every failure resolves to null
// rather than throwing.
export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<Weather | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const lat = latitude.toFixed(4);
    const lon = longitude.toFixed(4);
    const response = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": USER_AGENT }, signal: controller.signal },
    );
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as LocationforecastResponse;
    const details = body.properties?.timeseries?.[0]?.data?.instant?.details;
    if (
      details?.air_temperature === undefined ||
      details.wind_speed === undefined ||
      details.wind_from_direction === undefined
    ) {
      return null;
    }
    return {
      temperatureCelsius: details.air_temperature,
      windSpeedMs: details.wind_speed,
      windDirectionDegrees: details.wind_from_direction,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
