import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdentityProvider, useIdentity } from "./IdentityContext";
import * as identityApi from "./api";

vi.mock("./api");

function Consumer() {
  const { status, user, isOnboardingOpen, closeOnboarding } = useIdentity();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="onboarding-open">{String(isOnboardingOpen)}</div>
      <div data-testid="user-id">{user ? user.id : "none"}</div>
      <button onClick={closeOnboarding}>close</button>
    </div>
  );
}

function renderConsumer() {
  return render(
    <IdentityProvider>
      <Consumer />
    </IdentityProvider>,
  );
}

describe("IdentityContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts loading and resolves to ready", async () => {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
    renderConsumer();
    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    expect(await screen.findByTestId("status")).toHaveTextContent("ready");
  });

  it("auto-opens onboarding when there's no user and it hasn't been dismissed", async () => {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
    renderConsumer();
    expect(await screen.findByTestId("onboarding-open")).toHaveTextContent(
      "true",
    );
  });

  it("does not auto-open onboarding once dismissed", async () => {
    localStorage.setItem("medisc-welcome-dismissed", "1");
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
    renderConsumer();
    await screen.findByTestId("status");
    expect(screen.getByTestId("onboarding-open")).toHaveTextContent("false");
  });

  it("does not auto-open onboarding when a user already exists", async () => {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({
      user: { id: 7, createdAt: "", claimedPlayer: null },
    });
    renderConsumer();
    expect(await screen.findByTestId("user-id")).toHaveTextContent("7");
    expect(screen.getByTestId("onboarding-open")).toHaveTextContent("false");
  });

  it("does not auto-open onboarding when the identity fetch fails", async () => {
    vi.mocked(identityApi.getCurrentUser).mockRejectedValue(
      new Error("network error"),
    );
    renderConsumer();
    expect(await screen.findByTestId("status")).toHaveTextContent("ready");
    expect(screen.getByTestId("onboarding-open")).toHaveTextContent("false");
  });

  it("sets the dismissed flag when closeOnboarding is called", async () => {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
    const user = userEvent.setup();
    renderConsumer();
    await screen.findByTestId("status");

    await user.click(screen.getByRole("button", { name: "close" }));

    expect(localStorage.getItem("medisc-welcome-dismissed")).toBe("1");
    expect(screen.getByTestId("onboarding-open")).toHaveTextContent("false");
  });
});
