import { describe, expect, it } from "vitest";
import { scoreOutcome } from "./scoreColor";

describe("scoreOutcome", () => {
  it("classifies strokes under par as birdie", () => {
    expect(scoreOutcome(2, 3)).toBe("birdie");
    expect(scoreOutcome(1, 4)).toBe("birdie"); // eagle still counts as birdie-colored
  });

  it("classifies strokes equal to par as par", () => {
    expect(scoreOutcome(3, 3)).toBe("par");
  });

  it("classifies strokes over par as bogey", () => {
    expect(scoreOutcome(4, 3)).toBe("bogey");
    expect(scoreOutcome(6, 3)).toBe("bogey"); // double-bogey+ still counts as bogey-colored
  });
});
