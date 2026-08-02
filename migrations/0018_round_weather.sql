-- Weather at the course, fetched from yr.no at round-creation time. Best
-- effort: a failed or slow fetch never blocks creating the round, so these
-- stay NULL when the course has no coordinates or the API call fails.
-- Locationforecast only returns current/forecast conditions (no history),
-- so rounds created before this column existed simply have no weather.
ALTER TABLE rounds ADD COLUMN temperature_celsius REAL;
ALTER TABLE rounds ADD COLUMN wind_speed_ms REAL;
ALTER TABLE rounds ADD COLUMN wind_direction_degrees REAL;
