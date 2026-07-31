import { beforeEach, describe, expect, it } from "vitest";
import { getDeviceToken } from "./deviceToken";

describe("deviceToken", () => {
  beforeEach(() => localStorage.clear());

  it("generates and persists a token on first call", () => {
    const token = getDeviceToken();
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(localStorage.getItem("medisc-device-token")).toBe(token);
  });

  it("reuses the same token across calls", () => {
    const first = getDeviceToken();
    const second = getDeviceToken();
    expect(second).toBe(first);
  });
});
