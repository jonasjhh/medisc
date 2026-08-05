import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareRoundDialog } from "./ShareRoundDialog";
import type { RoundDetail } from "./api";
import { ThemeModeProvider } from "../app/ThemeModeContext";

const round: RoundDetail = {
  id: 1,
  createdAt: "2026-08-01 08:00:00",
  completedAt: "2026-08-01 10:30:00",
  counting: true,
  course: { id: 1, name: "Maple Hill" },
  layout: { id: 10, name: "Blue" },
  holes: [{ id: 100, number: 1, par: 3, distanceMeters: 90 }],
  players: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ],
  scores: [
    {
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes: 3,
      penalties: 0,
      recorded: true,
    },
    {
      id: 1001,
      holeId: 100,
      playerId: 2,
      strokes: 4,
      penalties: 0,
      recorded: true,
    },
  ],
  weather: null,
};

const fakeContext = {
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  font: "",
  textAlign: "left",
  textBaseline: "alphabetic",
};

const fakeBlob = new Blob(["fake"], { type: "image/png" });

function mockCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    fakeContext as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => callback(fakeBlob),
  );
}

function renderDialog(props: { onClose: () => void; round: RoundDetail }) {
  return render(
    <ThemeModeProvider>
      <ShareRoundDialog open onClose={props.onClose} round={props.round} />
    </ThemeModeProvider>,
  );
}

describe("ShareRoundDialog", () => {
  beforeEach(() => {
    mockCanvas();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the full scorecard plus one card per player", () => {
    renderDialog({ onClose: vi.fn(), round });

    expect(
      screen.getByRole("img", { name: "Full scorecard preview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Alice scorecard preview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Bob scorecard preview" }),
    ).toBeInTheDocument();
  });

  it("shares the rendered image via the Web Share API when supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      canShare: () => true,
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onClose, round });

    await user.click(
      screen.getByRole("button", { name: /alice scorecard preview/i }),
    );

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const call = share.mock.calls[0][0];
    expect(call.files[0]).toBeInstanceOf(File);
    expect(call.title).toBe("Maple Hill — Alice scorecard");
    expect(onClose).toHaveBeenCalled();
  });

  it("downloads the image instead when file sharing isn't supported", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      share: undefined,
      canShare: undefined,
    });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onClose, round });

    expect(screen.getByText(/pick a card to download/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /full scorecard preview/i }),
    );

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("silently ignores the user cancelling the native share sheet", async () => {
    const abortError = new DOMException("cancelled", "AbortError");
    const share = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      canShare: () => true,
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onClose, round });

    await user.click(
      screen.getByRole("button", { name: /full scorecard preview/i }),
    );

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText(/couldn't/i)).not.toBeInTheDocument();
  });

  it("shows an error message when sharing fails for another reason", async () => {
    const share = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      canShare: () => true,
    });
    const user = userEvent.setup();
    renderDialog({ onClose: vi.fn(), round });

    await user.click(
      screen.getByRole("button", { name: /full scorecard preview/i }),
    );

    expect(await screen.findByText("network down")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onClose, round });

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
