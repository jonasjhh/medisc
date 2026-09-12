-- The coordinates applied to Jervskogen in 0026 were actually meant for
-- Trehjørningen (mixed up when supplied). Reverts Jervskogen to its
-- earlier user-confirmed coordinates and gives Trehjørningen the ones
-- that were misapplied.
UPDATE courses SET latitude = 63.363857, longitude = 10.743970
  WHERE name = 'Jervskogen Diskgolfpark';
UPDATE courses SET latitude = 63.363562, longitude = 10.742004
  WHERE name = 'Trehjørningen Disc Golf Park';
