const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC with no
// timezone marker, which some browsers parse as local time rather than UTC.
// Normalize to ISO 8601 with an explicit "Z" before handing it to Date.
export function formatDateTime(sqliteTimestamp: string): string {
  const iso = sqliteTimestamp.includes("T")
    ? sqliteTimestamp
    : `${sqliteTimestamp.replace(" ", "T")}Z`;
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

// Converts a stored UTC timestamp to the value a native
// <input type="datetime-local"> expects: local time, "YYYY-MM-DDTHH:mm",
// no seconds.
export function toDateTimeLocalValue(sqliteTimestamp: string): string {
  const iso = sqliteTimestamp.includes("T")
    ? sqliteTimestamp
    : `${sqliteTimestamp.replace(" ", "T")}Z`;
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// The inverse of toDateTimeLocalValue: a datetime-local input's value has
// no timezone marker, so `new Date(...)` already parses it as local time —
// convert that to the "YYYY-MM-DD HH:MM:SS" UTC string format used
// everywhere a round's created_at is stored.
export function fromDateTimeLocalValue(localValue: string): string {
  const date = new Date(localValue);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
