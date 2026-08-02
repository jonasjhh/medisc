-- Backfills weather for the two production rounds that predate the
-- weather feature (or whose weather fetch never ran). Values are real
-- historical observations for each round's course and time, sourced from
-- Open-Meteo's archive/forecast APIs (MET Norway's Locationforecast only
-- covers current/forecast conditions, not history) — averaged/nearest-hour
-- from the two surrounding hourly readings.
UPDATE rounds
SET temperature_celsius = 14.2,
    wind_speed_ms = 1.2,
    wind_direction_degrees = 208,
    weather_symbol_code = 'clearsky_day'
WHERE id = (
  SELECT rounds.id
  FROM rounds
  JOIN courses ON courses.id = rounds.course_id
  WHERE courses.name = 'Dragvoll Diskgolfpark'
  ORDER BY rounds.created_at ASC
  LIMIT 1
);

UPDATE rounds
SET temperature_celsius = 13.6,
    wind_speed_ms = 2.1,
    wind_direction_degrees = 55,
    weather_symbol_code = 'partlycloudy_day'
WHERE id = (
  SELECT rounds.id
  FROM rounds
  JOIN courses ON courses.id = rounds.course_id
  WHERE courses.name = 'Trolla Diskgolfpark'
  ORDER BY rounds.created_at DESC
  LIMIT 1
);
