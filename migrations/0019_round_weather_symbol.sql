-- Lets the UI show a weather icon (sun/cloud/rain/etc.) alongside the
-- temperature and wind. Nullable: yr.no's next_1_hours summary (which
-- carries the symbol) isn't guaranteed to be present for every location.
ALTER TABLE rounds ADD COLUMN weather_symbol_code TEXT;
