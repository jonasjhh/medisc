import { postJson, request } from "../api/client";

export interface ClaimedPlayer {
  id: number;
  name: string;
}

export interface IdentityUser {
  id: number;
  createdAt: string;
  claimedPlayer: ClaimedPlayer | null;
}

export function getCurrentUser(): Promise<{ user: IdentityUser | null }> {
  return request("/api/users/me");
}

export function createUser(): Promise<{ user: IdentityUser }> {
  return postJson("/api/users", {});
}

export function createLinkCode(): Promise<{ code: string; expiresAt: string }> {
  return postJson("/api/users/me/link-code", {});
}

export function linkDevice(code: string): Promise<{ user: IdentityUser }> {
  return postJson("/api/users/link", { code });
}

export function unclaimPlayer(): Promise<{ user: IdentityUser }> {
  return postJson("/api/users/me/unclaim", {});
}
