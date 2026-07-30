-- A course can have multiple layouts (e.g. "Blue", "Championship"), and the
-- same physical hole can carry a different par/distance on each layout, so
-- holes belong to a layout rather than directly to a course.
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses (id),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS holes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  layout_id INTEGER NOT NULL REFERENCES layouts (id),
  number INTEGER NOT NULL,
  par INTEGER NOT NULL,
  distance_feet INTEGER,
  UNIQUE (layout_id, number)
);

CREATE INDEX IF NOT EXISTS idx_layouts_course_id ON layouts (course_id);
CREATE INDEX IF NOT EXISTS idx_holes_layout_id ON holes (layout_id);
