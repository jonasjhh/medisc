import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnclaimDialog } from "./UnclaimDialog";
import { IdentityProvider } from "./IdentityContext";
import { InstallPromptProvider } from "../app/InstallPromptContext";
import * as identityApi from "./api";

vi.mock("./api");

function renderDialog(onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <InstallPromptProvider>
        <IdentityProvider>
          <UnclaimDialog open={true} onClose={onClose} />
        </IdentityProvider>
      </InstallPromptProvider>,
    ),
  };
}

describe("UnclaimDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({
      user: {
        id: 1,
        createdAt: "",
        claimedPlayer: { id: 10, name: "Alice" },
      },
    });
  });

  it("names the currently claimed player in the confirmation text", async () => {
    renderDialog();
    expect(await screen.findByText(/Alice/)).toBeInTheDocument();
  });

  it("unclaims the player, applies the updated user, and closes on confirm", async () => {
    vi.mocked(identityApi.unclaimPlayer).mockResolvedValue({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    const user = userEvent.setup();
    const { onClose } = renderDialog();
    await screen.findByText(/Alice/);

    await user.click(screen.getByRole("button", { name: "Remove link" }));

    expect(identityApi.unclaimPlayer).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("closes without unclaiming when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();
    await screen.findByText(/Alice/);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(identityApi.unclaimPlayer).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an error and re-enables the confirm button if unclaiming fails", async () => {
    vi.mocked(identityApi.unclaimPlayer).mockRejectedValue(
      new Error("network down"),
    );
    const user = userEvent.setup();
    renderDialog();
    await screen.findByText(/Alice/);

    const confirmButton = screen.getByRole("button", { name: "Remove link" });
    await user.click(confirmButton);

    expect(await screen.findByText("network down")).toBeInTheDocument();
    expect(confirmButton).toBeEnabled();
  });
});
