-- A stable reference to the record a business was imported from, so the same
-- OpenStreetMap feature cannot be imported twice across separate searches.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS external_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_external_ref_key
  ON businesses (external_ref) WHERE external_ref IS NOT NULL;
