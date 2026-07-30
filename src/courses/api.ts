import { postJson, request } from "../api/client";

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
  distanceMeters: number | null;
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
  distanceMeters?: number | null;
}

export function listCourses(): Promise<{ courses: CourseSummary[] }> {
  return request("/api/courses");
}

export function createCourse(name: string): Promise<NewCourse> {
  return postJson("/api/courses", { name });
}

export function getCourse(courseId: number): Promise<CourseDetail> {
  return request(`/api/courses/${courseId}`);
}

export function createLayout(
  courseId: number,
  name: string,
): Promise<NewLayout> {
  return postJson(`/api/courses/${courseId}/layouts`, { name });
}

export function createHole(
  layoutId: number,
  input: NewHoleInput,
): Promise<NewHole> {
  return postJson(`/api/layouts/${layoutId}/holes`, input);
}
