import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { ThemeModeProvider } from "./app/ThemeModeContext";
import { InstallPromptProvider } from "./app/InstallPromptContext";
import { IdentityProvider } from "./identity/IdentityContext";
import * as identityApi from "./identity/api";

vi.mock("./identity/api");

function dispatchBeforeInstallPrompt() {
  const event = new Event("beforeinstallprompt", {
    cancelable: true,
  }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string; platform: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

function renderApp() {
  return render(
    <ThemeModeProvider>
      <InstallPromptProvider>
        <IdentityProvider>
          <App />
        </IdentityProvider>
      </InstallPromptProvider>
    </ThemeModeProvider>,
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
  });

  it("renders the home route", async () => {
    renderApp();
    expect(
      await screen.findByRole("heading", { name: /medisc/i }),
    ).toBeInTheDocument();
  });

  it("lets you switch the theme mode", async () => {
    localStorage.setItem("medisc-welcome-dismissed", "1");
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: /medisc/i });

    await user.click(screen.getByRole("button", { name: /theme mode/i }));
    await user.click(await screen.findByRole("menuitem", { name: /dark/i }));

    expect(localStorage.getItem("medisc-theme-mode")).toBe("dark");
  });

  it("shows the onboarding modal when no user exists yet", async () => {
    renderApp();
    expect(
      await screen.findByRole("heading", { name: /set up your profile/i }),
    ).toBeInTheDocument();
  });

  it("does not show the onboarding modal once dismissed", async () => {
    localStorage.setItem("medisc-welcome-dismissed", "1");
    renderApp();
    await screen.findByRole("heading", { name: /medisc/i });
    expect(
      screen.queryByRole("heading", { name: /set up your profile/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show the onboarding modal when a user already exists", async () => {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    renderApp();
    await screen.findByRole("heading", { name: /medisc/i });
    expect(
      screen.queryByRole("heading", { name: /set up your profile/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the install prompt before the onboarding modal, never both at once", async () => {
    const user = userEvent.setup();
    renderApp();
    dispatchBeforeInstallPrompt();

    await screen.findByRole("button", { name: /install/i });
    expect(
      screen.queryByRole("heading", { name: /set up your profile/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(
      await screen.findByRole("heading", { name: /set up your profile/i }),
    ).toBeInTheDocument();
  });
});
