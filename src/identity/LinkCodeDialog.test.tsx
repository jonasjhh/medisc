import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LinkCodeDialog } from "./LinkCodeDialog";
import * as identityApi from "./api";

vi.mock("./api");

describe("LinkCodeDialog", () => {
  it("does not request a code while closed", () => {
    render(<LinkCodeDialog open={false} onClose={vi.fn()} />);
    expect(identityApi.createLinkCode).not.toHaveBeenCalled();
  });

  it("generates and displays a code with a countdown", async () => {
    vi.mocked(identityApi.createLinkCode).mockResolvedValue({
      code: "ABCDEFGH",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    render(<LinkCodeDialog open={true} onClose={vi.fn()} />);

    expect(await screen.findByText("ABCDEFGH")).toBeInTheDocument();
    expect(screen.getByText(/Expires in \d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("shows an error when code generation fails", async () => {
    vi.mocked(identityApi.createLinkCode).mockRejectedValue(
      new Error("network down"),
    );
    render(<LinkCodeDialog open={true} onClose={vi.fn()} />);

    expect(await screen.findByText("network down")).toBeInTheDocument();
  });

  it("shows an expired message once the code's time is up", async () => {
    vi.mocked(identityApi.createLinkCode).mockResolvedValue({
      code: "ABCDEFGH",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    render(<LinkCodeDialog open={true} onClose={vi.fn()} />);

    expect(
      await screen.findByText("Expired — generate a new one"),
    ).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", async () => {
    vi.mocked(identityApi.createLinkCode).mockResolvedValue({
      code: "ABCDEFGH",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<LinkCodeDialog open={true} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("requests a fresh code each time it's reopened", async () => {
    vi.mocked(identityApi.createLinkCode).mockResolvedValue({
      code: "ABCDEFGH",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    const { rerender } = render(
      <LinkCodeDialog open={true} onClose={vi.fn()} />,
    );
    await screen.findByText("ABCDEFGH");

    rerender(<LinkCodeDialog open={false} onClose={vi.fn()} />);
    rerender(<LinkCodeDialog open={true} onClose={vi.fn()} />);

    await screen.findByText("ABCDEFGH");
    expect(identityApi.createLinkCode).toHaveBeenCalledTimes(2);
  });
});
