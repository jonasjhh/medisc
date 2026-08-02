-- Lets the worker look up a course's location to fetch weather conditions
-- from the yr.no (MET Norway) API when a round is created there. Nullable
-- since there's no course-creation UI (courses are seeded via migration),
-- so older/future seeds may not always set these.
ALTER TABLE courses ADD COLUMN latitude REAL;
ALTER TABLE courses ADD COLUMN longitude REAL;

UPDATE courses SET latitude = 63.4066, longitude = 10.4738
  WHERE name = 'Dragvoll Diskgolfpark';
UPDATE courses SET latitude = 63.4797, longitude = 10.9323
  WHERE name = 'Stjørdal Discgolfpark';
UPDATE courses SET latitude = 63.3595, longitude = 10.3874
  WHERE name = 'Tillerskogen Diskgolfpark';
UPDATE courses SET latitude = 63.3956, longitude = 10.4247
  WHERE name = 'Risvollan';
UPDATE courses SET latitude = 63.4511, longitude = 10.2989
  WHERE name = 'Trolla Diskgolfpark';
