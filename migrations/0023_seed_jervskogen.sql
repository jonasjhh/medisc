-- Seeds Jervskogen Diskgolfpark (Hommelvik, Norway) with its two 2026
-- layouts, sourced from UDisc: "Hvit 2026" (18 holes, par 60, 1761 m)
-- and "Blå 2026" (18 holes, par 59, 2007 m).
INSERT INTO courses (name, latitude, longitude)
VALUES ('Jervskogen Diskgolfpark', 63.363857, 10.743970);

INSERT INTO layouts (course_id, name)
SELECT id, 'Hvit 2026' FROM courses WHERE name = 'Jervskogen Diskgolfpark';
INSERT INTO layouts (course_id, name)
SELECT id, 'Blå 2026' FROM courses WHERE name = 'Jervskogen Diskgolfpark';

-- Hvit 2026
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 3, 94 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 73 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 107 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 4, 172 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 3, 88 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 5, 152 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 86 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 70 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 4, 144 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 63 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 3, 81 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 5, 159 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 3, 98 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 14, 3, 50 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 15, 3, 80 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 16, 3, 69 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 17, 3, 97 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 18, 3, 78 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Hvit 2026';

-- Blå 2026
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 3, 94 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 109 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 107 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 4, 201 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 3, 115 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 4, 152 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 3, 101 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 70 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 4, 172 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 63 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 3, 81 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 4, 159 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 3, 98 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 14, 3, 50 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 15, 3, 102 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 16, 3, 91 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 17, 3, 97 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 18, 4, 145 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Jervskogen Diskgolfpark' AND layouts.name = 'Blå 2026';

-- Ten holes share the exact tee-to-basket distance across both layouts
-- (numbers 1, 3, 6, 8, 10, 11, 12, 13, 14, 17) — treated as the same
-- physical basket. Hvit is kept canonical (physical_hole_id left NULL)
-- and the matching Blå hole points at it. Holes 6 and 12 share a
-- distance but carry a different assigned par per layout (Hvit: par 5,
-- Blå: par 4) — linked anyway since this models the physical location,
-- not the score; Tillerskogen already has the same situation (Rød 15 /
-- Blå 17, both 98m, par 4 vs par 3).
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 1
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 1
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 3
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 3
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 6
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 6
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 8
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 8
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 10
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 10
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 11
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 11
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 12
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 12
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 13
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 13
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 14
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 14
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Hvit 2026' AND h.number = 17
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Jervskogen Diskgolfpark' AND l.name = 'Blå 2026' AND h.number = 17
);
