-- Lets a client tag a round-creation request with its own key so a retried
-- request (e.g. the response was lost over a flaky connection) returns the
-- round that was already created instead of creating a duplicate. NULL for
-- rounds created without a key (or before this column existed).
ALTER TABLE rounds ADD COLUMN client_request_id TEXT;

CREATE UNIQUE INDEX idx_rounds_client_request_id
  ON rounds (client_request_id)
  WHERE client_request_id IS NOT NULL;
