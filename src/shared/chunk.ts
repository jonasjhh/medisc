// Both the course layout page and the round scorecard split holes into
// 9-hole groups (front/back nine, etc.), so this lives alongside chunk()
// as the one shared source of truth for that grouping size.
export const HOLES_PER_GROUP = 9;

export function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  );
}
