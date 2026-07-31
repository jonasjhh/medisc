-- Different layouts on the same course can route over the same physical
-- tee-to-basket location (just reached in a different order / numbered
-- differently). physical_hole_id lets one layout's hole row point at
-- another layout's hole row for the same physical location, so future
-- per-hole stats can group by COALESCE(physical_hole_id, id) instead of
-- raw hole id, which is otherwise unique per layout.
ALTER TABLE holes ADD COLUMN physical_hole_id INTEGER REFERENCES holes (id);

CREATE INDEX IF NOT EXISTS idx_holes_physical_hole_id ON holes (physical_hole_id);
