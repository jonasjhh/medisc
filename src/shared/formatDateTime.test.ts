import { describe, expect, it } from "vitest";
import { formatDateTime } from "./formatDateTime";

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
