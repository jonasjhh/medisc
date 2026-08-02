-- Seeds Risvollan (Trondheim, Norway) with its "Risvollan 2025" layout,
-- sourced from UDisc: 13 holes, par 39, 739 m total.
INSERT INTO courses (name) VALUES ('Risvollan');

INSERT INTO layouts (course_id, name)
SELECT id, 'Risvollan 2025' FROM courses WHERE name = 'Risvollan';

INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 3, 52 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 29 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 50 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 3, 66 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 3, 60 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 3, 47 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 57 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 74 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 3, 63 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 46 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 3, 89 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 3, 46 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 3, 59 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Risvollan' AND layouts.name = 'Risvollan 2025';
