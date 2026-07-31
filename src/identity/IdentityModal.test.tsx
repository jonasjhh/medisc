import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdentityModal } from "./IdentityModal";
import { IdentityProvider, useIdentity } from "./IdentityContext";
import * as identityApi from "./api";
import * as playersApi from "../players/api";
import { InstallPromptProvider } from "../app/InstallPromptContext";

vi.mock("./api");
vi.mock("../players/api");

function OpenOnboardingButton({ step }: { step?: "welcome" | "claim" }) {
  const { openOnboarding } = useIdentity();
  return <button onClick={() => openOnboarding(step)}>open</button>;
}

function renderModal(step?: "welcome" | "claim") {
  return render(
    <InstallPromptProvider>
      <IdentityProvider>
        <OpenOnboardingButton step={step} />
        <IdentityModal />
      </IdentityProvider>
    </InstallPromptProvider>,
  );
}

describe("IdentityModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("medisc-welcome-dismissed", "1");
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
  });

  it("creates a user and moves to the claim step when unclaimed", async () => {
    vi.mocked(identityApi.createUser).mockResolvedValue({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 10,
          name: "Alice",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: null,
        },
        {
          id: 11,
          name: "Bob",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: null,
        },
      ],
    });
    const user = userEvent.setup();
    renderModal("welcome");

    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(
      await screen.findByRole("button", { name: "Get Started" }),
    );

    expect(await screen.findByText("Is one of these you?")).toBeInTheDocument();
    expect(playersApi.listPlayers).toHaveBeenCalledWith({ unclaimed: true });
    expect(await screen.findByLabelText("Alice")).toBeInTheDocument();
    expect(screen.getByLabelText("Bob")).toBeInTheDocument();
  });

  it("claims the selected player and closes", async () => {
    vi.mocked(identityApi.createUser).mockResolvedValue({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 10,
          name: "Alice",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: null,
        },
      ],
    });
    vi.mocked(playersApi.claimPlayer).mockResolvedValue({
      id: 10,
      name: "Alice",
      createdAt: "",
      roundCount: 0,
      claimedByUserId: 1,
    });
    const user = userEvent.setup();
    renderModal("welcome");

    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(
      await screen.findByRole("button", { name: "Get Started" }),
    );
    await user.click(await screen.findByLabelText("Alice"));
    await user.click(screen.getByRole("button", { name: "Claim" }));

    expect(playersApi.claimPlayer).toHaveBeenCalledWith(10);
    await screen.findByRole("button", { name: "open" });
    expect(screen.queryByText("Is one of these you?")).not.toBeInTheDocument();
  });

  it("skips the claim step without calling claimPlayer", async () => {
    vi.mocked(identityApi.createUser).mockResolvedValue({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 10,
          name: "Alice",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: null,
        },
      ],
    });
    const user = userEvent.setup();
    renderModal("welcome");

    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(
      await screen.findByRole("button", { name: "Get Started" }),
    );
    await screen.findByText("Is one of these you?");
    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(playersApi.claimPlayer).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByText("Is one of these you?"),
      ).not.toBeInTheDocument(),
    );
  });

  it("links a device and closes without a claim step when already claimed", async () => {
    vi.mocked(identityApi.linkDevice).mockResolvedValue({
      user: {
        id: 1,
        createdAt: "",
        claimedPlayer: { id: 10, name: "Alice" },
      },
    });
    const user = userEvent.setup();
    renderModal("welcome");

    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(
      await screen.findByRole("button", { name: /already have an account/i }),
    );
    await user.type(screen.getByLabelText("Link code"), "abcdefgh");
    await user.click(screen.getByRole("button", { name: "Link this device" }));

    expect(identityApi.linkDevice).toHaveBeenCalledWith("ABCDEFGH");
    await screen.findByRole("button", { name: "open" });
    expect(screen.queryByText("Is one of these you?")).not.toBeInTheDocument();
    expect(playersApi.listPlayers).not.toHaveBeenCalled();
  });

  it("opens directly at the claim step", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 10,
          name: "Alice",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: null,
        },
      ],
    });
    const user = userEvent.setup();
    renderModal("claim");

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(await screen.findByText("Is one of these you?")).toBeInTheDocument();
    expect(identityApi.createUser).not.toHaveBeenCalled();
  });

  it("dismisses without creating a user via Not now", async () => {
    const user = userEvent.setup();
    renderModal("welcome");

    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(await screen.findByRole("button", { name: "Not now" }));

    expect(identityApi.createUser).not.toHaveBeenCalled();
    expect(localStorage.getItem("medisc-welcome-dismissed")).toBe("1");
  });
});
