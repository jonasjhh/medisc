export interface CourseSummary {
  id: number;
  name: string;
  createdAt: string;
  layoutCount: number;
}

export interface NewCourse {
  id: number;
  name: string;
  createdAt: string;
}

export interface Hole {
  id: number;
  number: number;
  par: number;
  distanceFeet: number | null;
}

export interface NewHole extends Hole {
  layoutId: number;
}

export interface Layout {
  id: number;
  name: string;
  createdAt: string;
  holes: Hole[];
}

export interface NewLayout {
  id: number;
  courseId: number;
  name: string;
  createdAt: string;
}

export interface CourseDetail {
  id: number;
  name: string;
  createdAt: string;
  layouts: Layout[];
}

export interface NewHoleInput {
  number: number;
  par: number;
  distanceFeet?: number | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body?.error === "string"
        ? body.error
        : body?.error
          ? JSON.stringify(body.error)
          : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

const jsonHeaders = { "content-type": "application/json" };

export function listCourses(): Promise<{ courses: CourseSummary[] }> {
  return request("/api/courses");
}

export function createCourse(name: string): Promise<NewCourse> {
  return request("/api/courses", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ name }),
  });
}

export function getCourse(courseId: number): Promise<CourseDetail> {
  return request(`/api/courses/${courseId}`);
}

export function createLayout(
  courseId: number,
  name: string,
): Promise<NewLayout> {
  return request(`/api/courses/${courseId}/layouts`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ name }),
  });
}

export function createHole(
  layoutId: number,
  input: NewHoleInput,
): Promise<NewHole> {
  return request(`/api/layouts/${layoutId}/holes`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
}
