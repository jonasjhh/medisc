-- Marks whether a round should count towards a player's stats. Defaults to
-- true; toggled off for casual/practice rounds that shouldn't skew averages.
ALTER TABLE rounds ADD COLUMN counting INTEGER NOT NULL DEFAULT 1;
