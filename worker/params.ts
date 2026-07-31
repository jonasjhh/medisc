export function parseIntParam(raw: string | undefined): number | null {
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}
