// SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC with no
// timezone marker, which some browsers parse as local time rather than UTC.
// Normalize to ISO 8601 with an explicit "Z" before handing it to Date.
export function formatDateTime(sqliteTimestamp: string): string {
  const iso = sqliteTimestamp.includes("T")
    ? sqliteTimestamp
    : `${sqliteTimestamp.replace(" ", "T")}Z`;
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
