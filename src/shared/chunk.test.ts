import { describe, expect, it } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("returns an empty array for an empty input", () => {
    expect(chunk([], 9)).toEqual([]);
  });

  it("returns a single group when the input is an exact multiple of the size", () => {
    const items = Array.from({ length: 9 }, (_, i) => i + 1);
    expect(chunk(items, 9)).toEqual([items]);
  });

  it("splits into two groups when the input is exactly double the size", () => {
    const items = Array.from({ length: 18 }, (_, i) => i + 1);
    expect(chunk(items, 9)).toEqual([items.slice(0, 9), items.slice(9)]);
  });

  it("puts the remainder in a smaller final group", () => {
    const items = Array.from({ length: 12 }, (_, i) => i + 1);
    expect(chunk(items, 9)).toEqual([items.slice(0, 9), items.slice(9)]);
  });
});
