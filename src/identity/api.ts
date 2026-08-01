import { postJson, request } from "../api/client";
import {
  currentUserResponseSchema,
  linkCodeResponseSchema,
  userResponseSchema,
} from "../../shared/contracts/identity";
import type {
  ClaimedPlayer,
  CurrentUserResponse,
  IdentityUser,
  LinkCodeResponse,
  UserResponse,
} from "../../shared/contracts/identity";

export type {
  ClaimedPlayer,
  CurrentUserResponse,
  IdentityUser,
  LinkCodeResponse,
  UserResponse,
};

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return currentUserResponseSchema.parse(await request("/api/users/me"));
}

export async function createUser(): Promise<UserResponse> {
  return userResponseSchema.parse(await postJson("/api/users", {}));
}

export async function createLinkCode(): Promise<LinkCodeResponse> {
  return linkCodeResponseSchema.parse(
    await postJson("/api/users/me/link-code", {}),
  );
}

export async function linkDevice(code: string): Promise<UserResponse> {
  return userResponseSchema.parse(await postJson("/api/users/link", { code }));
}

export async function unclaimPlayer(): Promise<UserResponse> {
  return userResponseSchema.parse(await postJson("/api/users/me/unclaim", {}));
}
