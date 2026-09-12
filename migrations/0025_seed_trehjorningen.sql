-- Seeds Trehjørningen Disc Golf Park with its "Gul 2026" layout
-- ("Trehjørningen 18 GUL (main)" on UDisc), sourced from UDisc:
-- 18 holes, par 61, 1293 m.
INSERT INTO courses (name) VALUES ('Trehjørningen Disc Golf Park');

INSERT INTO layouts (course_id, name)
SELECT id, 'Gul 2026' FROM courses WHERE name = 'Trehjørningen Disc Golf Park';

INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 3, 62 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 44 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 53 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 4, 132 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 3, 50 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 4, 86 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 53 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 62 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 4, 95 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 4, 121 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 3, 40 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 3, 69 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 4, 68 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 14, 3, 56 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 15, 3, 61 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 16, 3, 53 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 17, 4, 85 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 18, 4, 103 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trehjørningen Disc Golf Park' AND layouts.name = 'Gul 2026';
