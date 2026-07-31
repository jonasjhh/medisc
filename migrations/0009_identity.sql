-- Persistent client identity. A User is a device-portable identity (not a
-- login/password account) that can optionally "claim" exactly one Player
-- from the existing shared, unauthenticated roster as being themselves.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Maps an anonymous per-device token (generated client-side, persisted to
-- localStorage, sent as the X-Device-Token header) to the User it belongs
-- to. One User can have many device tokens (multi-device support via the
-- link-code flow below); a token maps to at most one User (PRIMARY KEY).
CREATE TABLE IF NOT EXISTS device_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);

-- Single-use, short-lived (~15 min) codes an existing User generates on one
-- device and redeems on a new device to link it to the same User.
CREATE TABLE IF NOT EXISTS device_link_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users (id),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_device_link_codes_user_id ON device_link_codes (user_id);

-- A Player is "claimed" once a User marks it as themselves. NULL means the
-- Player is still an unclaimed guest. The partial unique index enforces at
-- most one Player per User while leaving unlimited Players unclaimed (NULL
-- values are not subject to SQLite uniqueness).
ALTER TABLE players ADD COLUMN claimed_by_user_id INTEGER REFERENCES users (id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_claimed_by_user_id
  ON players (claimed_by_user_id)
  WHERE claimed_by_user_id IS NOT NULL;
