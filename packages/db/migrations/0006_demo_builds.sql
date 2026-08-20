-- Build jobs for mockups produced by Claude Code.
--
-- AgencyOS cannot run the CLI itself, so it queues the work and a worker
-- running where Claude Code lives claims it. The brief is stored verbatim so a
-- build is reproducible and auditable after the fact.

CREATE TABLE IF NOT EXISTS demo_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  demo_id uuid REFERENCES demos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','claimed','building','ready','failed','cancelled')),
  brief text NOT NULL,
  variation jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_html text,
  claimed_by text,
  claimed_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_builds_status_idx ON demo_builds (status, created_at);
CREATE INDEX IF NOT EXISTS demo_builds_business_idx ON demo_builds (business_id, created_at DESC);
