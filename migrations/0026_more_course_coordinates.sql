-- Corrects Jervskogen's coordinates (set in 0023 from an unverified
-- search-engine estimate) to the user-confirmed values, and adds
-- coordinates for Othilienborg (seeded in 0024 without any) so both get
-- weather lookups on round creation, matching the 0017 precedent.
UPDATE courses SET latitude = 63.363562, longitude = 10.742004
  WHERE name = 'Jervskogen Diskgolfpark';
UPDATE courses SET latitude = 63.402265, longitude = 10.440574
  WHERE name = 'Othilienborg Diskgolfpark';
