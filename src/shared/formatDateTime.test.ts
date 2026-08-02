import { describe, expect, it } from "vitest";
import { formatDateTime } from "./formatDateTime";

describe("formatDateTime", () => {
  it("formats a SQLite UTC timestamp as a locale date and time", () => {
    const result = formatDateTime("2026-01-15 14:30:00");
    const expected = new Date("2026-01-15T14:30:00Z").toLocaleString(
      undefined,
      { dateStyle: "medium", timeStyle: "short" },
    );
    expect(result).toBe(expected);
  });

  it("handles an already-ISO timestamp", () => {
    const result = formatDateTime("2026-01-15T14:30:00Z");
    const expected = new Date("2026-01-15T14:30:00Z").toLocaleString(
      undefined,
      { dateStyle: "medium", timeStyle: "short" },
    );
    expect(result).toBe(expected);
  });
});
