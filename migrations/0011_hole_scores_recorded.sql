-- Freshly seeded hole_scores start "unrecorded" (par is just a neutral
-- placeholder until a player explicitly enters a score); existing rows
-- backfill to recorded = 1 so already-played rounds don't regress to "-".
ALTER TABLE hole_scores ADD COLUMN recorded INTEGER NOT NULL DEFAULT 1;
