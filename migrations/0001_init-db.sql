-- One row per score/visit event, so every page load can insert a new line
-- and totals (site-wide or per user) are derived by aggregating over them.
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores (user_id);
