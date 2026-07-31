const STORAGE_KEY = "medisc-device-token";

export function getDeviceToken(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored;
  }
  const token = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, token);
  return token;
}
