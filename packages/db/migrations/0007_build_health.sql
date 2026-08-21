-- Health of a delivered mockup, checked at delivery.
--
-- A concept whose images do not load looks broken to the prospect while looking
-- finished in the queue, so the check has to happen before anyone can approve it.
ALTER TABLE demo_builds ADD COLUMN IF NOT EXISTS health jsonb;
