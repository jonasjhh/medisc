import { request } from "../api/client";

export interface CourseSummary {
  id: number;
  name: string;
  createdAt: string;
  layoutCount: number;
}

export interface Hole {
  id: number;
  number: number;
  par: number;
  distanceMeters: number | null;
}

export interface Layout {
  id: number;
  name: string;
  createdAt: string;
  holes: Hole[];
}

export interface CourseDetail {
  id: number;
  name: string;
  createdAt: string;
  layouts: Layout[];
}

export function listCourses(): Promise<{ courses: CourseSummary[] }> {
  return request("/api/courses");
}

export function getCourse(courseId: number): Promise<CourseDetail> {
  return request(`/api/courses/${courseId}`);
}
