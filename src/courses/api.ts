import { request } from "../api/client";
import {
  courseDetailSchema,
  courseListResponseSchema,
} from "../../shared/contracts/courses";
import type {
  CourseDetail,
  CourseListResponse,
  CourseSummary,
  Hole,
  Layout,
} from "../../shared/contracts/courses";

export type { CourseDetail, CourseListResponse, CourseSummary, Hole, Layout };

export async function listCourses(): Promise<CourseListResponse> {
  return courseListResponseSchema.parse(await request("/api/courses"));
}

export async function getCourse(courseId: number): Promise<CourseDetail> {
  return courseDetailSchema.parse(await request(`/api/courses/${courseId}`));
}
