-- Seeds Othilienborg Diskgolfpark with its "Othilienborg 2023" layout,
-- sourced from UDisc: 18 holes, par 56, 1430 m.
INSERT INTO courses (name) VALUES ('Othilienborg Diskgolfpark');

INSERT INTO layouts (course_id, name)
SELECT id, 'Othilienborg 2023' FROM courses WHERE name = 'Othilienborg Diskgolfpark';

INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 3, 77 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 102 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 48 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 3, 37 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 3, 65 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 3, 78 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 74 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 92 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 3, 59 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 71 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 3, 101 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 4, 121 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 3, 60 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 14, 3, 62 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 15, 4, 103 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 16, 3, 108 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 17, 3, 81 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 18, 3, 89 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Othilienborg Diskgolfpark' AND layouts.name = 'Othilienborg 2023';
