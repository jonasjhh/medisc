import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLinkCode,
  createUser,
  getCurrentUser,
  linkDevice,
  unclaimPlayer,
} from "./api";

function mockFetchOnce(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("identity api", () => {
  beforeEach(() => localStorage.clear());

  it("gets the current user", async () => {
    const fetchMock = mockFetchOnce({ user: null });
    const { user } = await getCurrentUser();
    expect(user).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/me",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("creates a user", async () => {
    const fetchMock = mockFetchOnce({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    await createUser();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({ method: "POST", body: JSON.stringify({}) }),
    );
  });

  it("creates a link code", async () => {
    const fetchMock = mockFetchOnce({ code: "ABCDEFGH", expiresAt: "" });
    const { code } = await createLinkCode();
    expect(code).toBe("ABCDEFGH");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/me/link-code",
      expect.objectContaining({ method: "POST", body: JSON.stringify({}) }),
    );
  });

  it("links a device with a code", async () => {
    const fetchMock = mockFetchOnce({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    await linkDevice("ABCDEFGH");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/link",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "ABCDEFGH" }),
      }),
    );
  });

  it("unclaims the current player", async () => {
    const fetchMock = mockFetchOnce({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    await unclaimPlayer();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/me/unclaim",
      expect.objectContaining({ method: "POST", body: JSON.stringify({}) }),
    );
  });
});
