-- Outreach messages, plus the two columns cold outreach cannot be done without.

CREATE TABLE IF NOT EXISTS outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  demo_id uuid REFERENCES demos(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'email',
  to_email text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','sent','opened','replied','interested','declined','no_response','bounced')),
  sent_at timestamptz,
  replied_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_messages_business_idx ON outreach_messages (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_messages_status_idx ON outreach_messages (status);

-- A business that asks not to be contacted must stay suppressed regardless of
-- which pipeline stage it later moves to, so this is a flag and not a stage.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false;

-- Commercial email has to carry a real postal address for the sender.
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS postal_address text;
