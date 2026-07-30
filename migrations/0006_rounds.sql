-- A round is a group of players playing one layout together. Players are a
-- lightweight reusable roster (add once, pick from the list next time)
-- rather than tied to any login. Every (round, player, hole) combination
-- gets its own scores row, seeded with par so the UI can adjust up/down
-- from a sensible default rather than starting at zero.
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses (id),
  layout_id INTEGER NOT NULL REFERENCES layouts (id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS round_players (
  round_id INTEGER NOT NULL REFERENCES rounds (id),
  player_id INTEGER NOT NULL REFERENCES players (id),
  PRIMARY KEY (round_id, player_id)
);

CREATE TABLE IF NOT EXISTS hole_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL REFERENCES rounds (id),
  player_id INTEGER NOT NULL REFERENCES players (id),
  hole_id INTEGER NOT NULL REFERENCES holes (id),
  strokes INTEGER NOT NULL,
  penalties INTEGER NOT NULL DEFAULT 0,
  UNIQUE (round_id, player_id, hole_id)
);

CREATE INDEX IF NOT EXISTS idx_rounds_course_id ON rounds (course_id);
CREATE INDEX IF NOT EXISTS idx_round_players_round_id ON round_players (round_id);
CREATE INDEX IF NOT EXISTS idx_hole_scores_round_id ON hole_scores (round_id);
