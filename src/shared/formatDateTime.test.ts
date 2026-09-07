import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "./formatDateTime";

describe("formatDateTime", () => {
  it("formats a SQLite UTC timestamp as DD MMM YYYY HH:mm", () => {
    expect(formatDateTime("2026-08-01 14:30:00")).toBe("01 Aug 2026 14:30");
  });

  it("handles an already-ISO timestamp", () => {
    expect(formatDateTime("2026-08-01T14:30:00Z")).toBe("01 Aug 2026 14:30");
  });

  it("zero-pads single-digit day, hour, and minute", () => {
    expect(formatDateTime("2026-01-05 09:07:00")).toBe("05 Jan 2026 09:07");
  });
});

// The test runner pins TZ=UTC (vite.config.ts), so local time equals UTC
// here — these helpers' round-trip behavior in other zones is exercised
// indirectly by RoundPage.test.tsx's edit-dialog test.
describe("toDateTimeLocalValue", () => {
  it("converts a stored UTC timestamp to a datetime-local value", () => {
    expect(toDateTimeLocalValue("2026-08-01 14:30:00")).toBe(
      "2026-08-01T14:30",
    );
  });

  it("zero-pads single-digit month, day, hour, and minute", () => {
    expect(toDateTimeLocalValue("2026-01-05 09:07:00")).toBe(
      "2026-01-05T09:07",
    );
  });
});

describe("fromDateTimeLocalValue", () => {
  it("converts a datetime-local value to the stored UTC timestamp format", () => {
    expect(fromDateTimeLocalValue("2026-08-01T14:30")).toBe(
      "2026-08-01 14:30:00",
    );
  });

  it("round-trips with toDateTimeLocalValue", () => {
    const original = "2026-03-15 08:05:00";
    expect(fromDateTimeLocalValue(toDateTimeLocalValue(original))).toBe(
      original,
    );
  });
});
