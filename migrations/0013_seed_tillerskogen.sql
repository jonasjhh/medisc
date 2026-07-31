-- Seeds Tillerskogen Diskgolfpark (Trondheim, Norway) with its two 2025
-- layouts, sourced from UDisc: "Rød 2025 (kort)" (21 holes,
-- par 71, 1809 m) and "Blå 2025 (lang)" (21 holes, par 72, 2375 m).
INSERT INTO courses (name) VALUES ('Tillerskogen Diskgolfpark');

INSERT INTO layouts (course_id, name)
SELECT id, 'Rød 2025 (kort)' FROM courses WHERE name = 'Tillerskogen Diskgolfpark';
INSERT INTO layouts (course_id, name)
SELECT id, 'Blå 2025 (lang)' FROM courses WHERE name = 'Tillerskogen Diskgolfpark';

-- Rød 2025 (kort)
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 4, 134 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 70 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 65 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 4, 126 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 4, 132 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 3, 63 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 4, 128 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 69 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 4, 100 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 64 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 3, 55 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 3, 53 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 3, 48 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 14, 5, 160 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 15, 4, 98 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 16, 3, 75 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 17, 3, 75 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 18, 3, 94 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 19, 3, 64 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 20, 3, 71 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 21, 3, 66 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Rød 2025 (kort)';

-- Blå 2025 (lang)
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 1, 4, 161 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 2, 3, 114 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 3, 3, 82 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 4, 4, 148 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 5, 4, 159 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 6, 3, 118 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 7, 4, 158 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 8, 3, 69 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 9, 4, 119 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 10, 3, 71 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 11, 4, 111 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 12, 3, 61 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 13, 3, 48 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 14, 5, 222 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 15, 4, 165 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 16, 3, 91 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 17, 3, 98 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 18, 3, 115 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 19, 3, 83 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 20, 3, 87 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';
INSERT INTO holes (layout_id, number, par, distance_meters)
SELECT layouts.id, 21, 3, 95 FROM layouts
JOIN courses ON courses.id = layouts.course_id
WHERE courses.name = 'Tillerskogen Diskgolfpark' AND layouts.name = 'Blå 2025 (lang)';

-- Four holes share the exact tee-to-basket distance across both layouts
-- (Rød hole 8 / Blå hole 8 at 69m, Rød hole 13 / Blå hole 13 at 48m,
-- Rød hole 15 / Blå hole 17 at 98m, Rød hole 20 / Blå hole 10 at 71m) —
-- treated as the same physical basket. The Rød hole is kept canonical
-- (physical_hole_id left NULL) and the matching Blå hole points at it.
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Rød 2025 (kort)' AND h.number = 8
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Blå 2025 (lang)' AND h.number = 8
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Rød 2025 (kort)' AND h.number = 13
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Blå 2025 (lang)' AND h.number = 13
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Rød 2025 (kort)' AND h.number = 15
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Blå 2025 (lang)' AND h.number = 17
);
UPDATE holes SET physical_hole_id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Rød 2025 (kort)' AND h.number = 20
)
WHERE id = (
  SELECT h.id FROM holes h
  JOIN layouts l ON l.id = h.layout_id
  JOIN courses c ON c.id = l.course_id
  WHERE c.name = 'Tillerskogen Diskgolfpark' AND l.name = 'Blå 2025 (lang)' AND h.number = 10
);
