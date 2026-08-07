-- Finishing a round now locks in every hole's current value as its
-- registered score (see worker/routes/rounds.ts's /complete handler), so
-- totals always reflect the whole round. That only applies going forward —
-- rounds completed before this fix shipped can still have hole_scores rows
-- left at recorded = 0 for any hole nobody explicitly touched, which made
-- their totals (and now the per-hole running total) show nothing for
-- those holes. Backfill: any score belonging to an already-completed round
-- is, by definition, the round's final registered value.
UPDATE hole_scores
SET recorded = 1
WHERE recorded = 0
  AND round_id IN (SELECT id FROM rounds WHERE completed_at IS NOT NULL);
