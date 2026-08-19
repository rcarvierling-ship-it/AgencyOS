-- Records sign-in attempts so repeated failures can be throttled.
-- /admin/login is publicly reachable and previously accepted unlimited guesses.

CREATE TABLE IF NOT EXISTS agency_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip text,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agency_login_attempts_email_idx
  ON agency_login_attempts (lower(email), created_at DESC);
CREATE INDEX IF NOT EXISTS agency_login_attempts_ip_idx
  ON agency_login_attempts (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS agency_login_attempts_created_idx
  ON agency_login_attempts (created_at);
