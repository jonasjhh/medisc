-- Seeds Stjørdal Discgolfpark (Stjørdal, Norway) with its "12 Hull - 2026"
-- layout, sourced from UDisc: 12 holes, par 39, 1092 m total.
INSERT INTO courses (name) VALUES ('Stjørdal Discgolfpark');

INSERT INTO layouts (course_id, name)
SELECT id, '12 Hull - 2026' FROM courses WHERE name = 'Stjørdal Discgolfpark';

INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 3, 85 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 4, 154 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 4, 120 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 3, 73 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 3, 69 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 3, 110 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 59 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 53 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 3, 78 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 46 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 4, 128 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 3, 116 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Stjørdal Discgolfpark' AND layouts.name = '12 Hull - 2026';
