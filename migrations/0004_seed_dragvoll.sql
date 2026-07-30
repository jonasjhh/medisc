-- Seeds Dragvoll Diskgolfpark (Trondheim, Norway) with its "Standard 2025 (A)"
-- layout, sourced from UDisc: 18 holes, par 59, 1595 m total.
INSERT INTO courses (name) VALUES ('Dragvoll Diskgolfpark');

INSERT INTO layouts (course_id, name)
SELECT id, 'Standard 2025 (A)' FROM courses WHERE name = 'Dragvoll Diskgolfpark';

INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 4, 111 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 82 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 4, 129 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 3, 80 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 3, 97 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 4, 101 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 83 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 4, 98 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 3, 78 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 69 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 3, 68 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 3, 68 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 3, 99 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 14, 3, 74 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 15, 3, 63 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 16, 4, 142 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 17, 3, 79 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 18, 3, 75 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Dragvoll Diskgolfpark' AND layouts.name = 'Standard 2025 (A)';
