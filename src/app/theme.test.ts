import { describe, expect, it } from "vitest";
import { createAppTheme } from "./theme";

describe("createAppTheme", () => {
  it("uses distinct primary colors and light surfaces for light mode", () => {
    const theme = createAppTheme("light");
    expect(theme.palette.mode).toBe("light");
    expect(theme.palette.primary.main).toBe("#2e6e4e");
    expect(theme.palette.background.default).toBe("#f6f7f5");
  });

  it("uses distinct primary colors and dark surfaces for dark mode", () => {
    const theme = createAppTheme("dark");
    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.primary.main).toBe("#7bc99a");
    expect(theme.palette.background.default).toBe("#121212");
  });

  it("switches contrast text between the two modes", () => {
    const light = createAppTheme("light");
    const dark = createAppTheme("dark");
    expect(light.palette.primary.contrastText).not.toBe(
      dark.palette.primary.contrastText,
    );
  });
});
