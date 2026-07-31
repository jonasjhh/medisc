import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InstallPrompt } from "./InstallPrompt";
import { InstallPromptProvider } from "./InstallPromptContext";

function renderInstallPrompt() {
  return render(
    <InstallPromptProvider>
      <InstallPrompt />
    </InstallPromptProvider>,
  );
}

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

describe("InstallPrompt", () => {
  it("renders nothing until beforeinstallprompt fires", () => {
    renderInstallPrompt();
    expect(
      screen.queryByRole("button", { name: /install/i }),
    ).not.toBeInTheDocument();
  });

  it("shows an Install button once captured, and triggers the native prompt on click", async () => {
    const user = userEvent.setup();
    renderInstallPrompt();

    const event = dispatchBeforeInstallPrompt();

    const button = await screen.findByRole("button", { name: /install/i });
    await user.click(button);

    expect(event.prompt).toHaveBeenCalled();
  });

  it("hides once the app is installed", async () => {
    renderInstallPrompt();
    dispatchBeforeInstallPrompt();
    await screen.findByRole("button", { name: /install/i });

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /install/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("hides when dismissed via the alert's close action", async () => {
    const user = userEvent.setup();
    renderInstallPrompt();
    dispatchBeforeInstallPrompt();
    await screen.findByRole("button", { name: /install/i });

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(
      screen.queryByRole("button", { name: /install/i }),
    ).not.toBeInTheDocument();
  });
});
