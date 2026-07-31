import { getDeviceToken } from "../identity/deviceToken";

const jsonHeaders = { "content-type": "application/json" };

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("X-Device-Token", getDeviceToken());
  const response = await fetch(path, { ...init, headers });
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
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
}

export function deleteRequest(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" });
}
