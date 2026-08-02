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
