import { fetchMock } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { fetchWeather } from "./weather";

describe("fetchWeather", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it("returns temperature, wind speed, wind direction, and symbol on success", async () => {
    fetchMock
      .get("https://api.met.no")
      .intercept({
        path: "/weatherapi/locationforecast/2.0/compact?lat=63.4066&lon=10.4738",
        method: "GET",
      })
      .reply(200, {
        properties: {
          timeseries: [
            {
              time: "2026-01-01T12:00:00Z",
              data: {
                instant: {
                  details: {
                    air_temperature: 14.3,
                    wind_speed: 3.2,
                    wind_from_direction: 270,
                  },
                },
                next_1_hours: {
                  summary: { symbol_code: "partlycloudy_day" },
                },
              },
            },
          ],
        },
      });

    const result = await fetchWeather(63.4066, 10.4738);
    expect(result).toEqual({
      temperatureCelsius: 14.3,
      windSpeedMs: 3.2,
      windDirectionDegrees: 270,
      symbolCode: "partlycloudy_day",
    });
  });

  it("returns a null symbol when next_1_hours is missing", async () => {
    fetchMock
      .get("https://api.met.no")
      .intercept({
        path: "/weatherapi/locationforecast/2.0/compact?lat=63.4066&lon=10.4738",
        method: "GET",
      })
      .reply(200, {
        properties: {
          timeseries: [
            {
              data: {
                instant: {
                  details: {
                    air_temperature: 14.3,
                    wind_speed: 3.2,
                    wind_from_direction: 270,
                  },
                },
              },
            },
          ],
        },
      });

    const result = await fetchWeather(63.4066, 10.4738);
    expect(result?.symbolCode).toBeNull();
  });

  it("rounds coordinates to 4 decimals in the request", async () => {
    fetchMock
      .get("https://api.met.no")
      .intercept({
        path: "/weatherapi/locationforecast/2.0/compact?lat=63.4066&lon=10.4738",
        method: "GET",
      })
      .reply(200, {
        properties: {
          timeseries: [
            {
              data: {
                instant: {
                  details: {
                    air_temperature: 10,
                    wind_speed: 1,
                    wind_from_direction: 0,
                  },
                },
              },
            },
          ],
        },
      });

    const result = await fetchWeather(63.40656789, 10.47378901);
    expect(result).not.toBeNull();
  });

  it("returns null when the API responds with a non-OK status", async () => {
    fetchMock
      .get("https://api.met.no")
      .intercept({
        path: "/weatherapi/locationforecast/2.0/compact?lat=63.4066&lon=10.4738",
        method: "GET",
      })
      .reply(503, "Service Unavailable");

    const result = await fetchWeather(63.4066, 10.4738);
    expect(result).toBeNull();
  });

  it("returns null when the response is missing expected fields", async () => {
    fetchMock
      .get("https://api.met.no")
      .intercept({
        path: "/weatherapi/locationforecast/2.0/compact?lat=63.4066&lon=10.4738",
        method: "GET",
      })
      .reply(200, { properties: { timeseries: [] } });

    const result = await fetchWeather(63.4066, 10.4738);
    expect(result).toBeNull();
  });

  it("returns null when the request errors", async () => {
    fetchMock
      .get("https://api.met.no")
      .intercept({
        path: "/weatherapi/locationforecast/2.0/compact?lat=63.4066&lon=10.4738",
        method: "GET",
      })
      .replyWithError(new Error("network down"));

    const result = await fetchWeather(63.4066, 10.4738);
    expect(result).toBeNull();
  });
});
