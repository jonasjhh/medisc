-- Seeds Trolla Diskgolfpark (Trondheim, Norway) with its "Trolla 2023"
-- layout, sourced from UDisc: 10 holes, par 33, 735 m total.
INSERT INTO courses (name) VALUES ('Trolla Diskgolfpark');

INSERT INTO layouts (course_id, name)
SELECT id, 'Trolla 2023' FROM courses WHERE name = 'Trolla Diskgolfpark';

INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 3, 51 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 75 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 70 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 3, 50 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 4, 125 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 3, 70 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 78 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 4, 55 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 4, 102 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 57 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Trolla Diskgolfpark' AND layouts.name = 'Trolla 2023';
