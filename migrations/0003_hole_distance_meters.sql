-- Course data (starting with Dragvoll Diskgolfpark) is in meters, not feet;
-- rename rather than edit 0002 in place in case it's already been applied.
ALTER TABLE holes RENAME COLUMN distance_feet TO distance_meters;
