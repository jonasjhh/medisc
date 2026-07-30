import { getItem, setItem } from "./localStore";

const USER_ID_KEY = "userId";

// Persists a random per-browser identifier so server-side visit counts can
// attribute repeat visits to the same visitor without any real auth.
export async function getOrCreateUserId(): Promise<string> {
  const existing = await getItem<string>(USER_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  await setItem(USER_ID_KEY, created);
  return created;
}
