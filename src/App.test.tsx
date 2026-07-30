import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { ThemeModeProvider } from "./app/ThemeModeContext";

function renderApp() {
  return render(
    <ThemeModeProvider>
      <App />
    </ThemeModeProvider>,
  );
}

describe("App", () => {
  it("renders the home route", () => {
    renderApp();
    expect(
      screen.getByRole("heading", { name: /medisc/i }),
    ).toBeInTheDocument();
  });

  it("lets you switch the theme mode", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /theme mode/i }));
    await user.click(await screen.findByRole("menuitem", { name: /dark/i }));

    expect(localStorage.getItem("medisc-theme-mode")).toBe("dark");
  });
});
