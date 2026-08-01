import { z } from "zod";

export const claimedPlayerSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type ClaimedPlayer = z.infer<typeof claimedPlayerSchema>;

export const identityUserSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  claimedPlayer: claimedPlayerSchema.nullable(),
});
export type IdentityUser = z.infer<typeof identityUserSchema>;

// GET /api/users/me can genuinely return no user yet (no device token
// resolves to one). The other endpoints below always resolve or create a
// concrete user, so their response never carries a null user.
export const currentUserResponseSchema = z.object({
  user: identityUserSchema.nullable(),
});
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;

export const userResponseSchema = z.object({
  user: identityUserSchema,
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const linkCodeResponseSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
});
export type LinkCodeResponse = z.infer<typeof linkCodeResponseSchema>;
