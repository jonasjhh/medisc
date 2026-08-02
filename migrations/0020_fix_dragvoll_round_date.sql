-- The earliest round at Dragvoll was created with the wrong created_at
-- (a data-entry mistake, not a bug); the round was actually played at
-- 10:30 local time (CEST, UTC+2) on 31 July 2026.
UPDATE rounds
SET created_at = '2026-07-31 08:30:00'
WHERE id = (
  SELECT rounds.id
  FROM rounds
  JOIN courses ON courses.id = rounds.course_id
  WHERE courses.name = 'Dragvoll Diskgolfpark'
  ORDER BY rounds.created_at ASC
  LIMIT 1
);
