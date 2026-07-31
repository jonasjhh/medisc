import { describe, expect, it } from "vitest";
import { scoreOutcome } from "./scoreColor";

describe("scoreOutcome", () => {
  it("classifies a hole-in-one as an ace regardless of par", () => {
    expect(scoreOutcome(1, 3)).toBe("ace");
    expect(scoreOutcome(1, 4)).toBe("ace");
  });

  it("classifies 2 or more strokes under par as an eagle", () => {
    expect(scoreOutcome(2, 4)).toBe("eagle");
    expect(scoreOutcome(2, 5)).toBe("eagle"); // 3 under still counts as eagle
  });

  it("classifies 1 stroke under par as a birdie", () => {
    expect(scoreOutcome(2, 3)).toBe("birdie");
  });

  it("classifies strokes equal to par as par", () => {
    expect(scoreOutcome(3, 3)).toBe("par");
  });

  it("classifies 1 stroke over par as a bogey", () => {
    expect(scoreOutcome(4, 3)).toBe("bogey");
  });

  it("classifies 2 strokes over par as a double bogey", () => {
    expect(scoreOutcome(5, 3)).toBe("doubleBogey");
  });

  it("classifies 3 or more strokes over par as worse", () => {
    expect(scoreOutcome(6, 3)).toBe("worse");
    expect(scoreOutcome(9, 3)).toBe("worse");
  });
});
