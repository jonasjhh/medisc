-- NULL means still in progress; once set, the round is locked from further
-- score edits and shows up as history rather than something to resume.
ALTER TABLE rounds ADD COLUMN completed_at TEXT;
