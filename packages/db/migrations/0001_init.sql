-- AgencyOS initial schema.
-- Idempotent: safe to re-run. Mirrors packages/db/schema.ts and the raw SQL
-- issued by apps/web (lib/admin-auth.ts, app/api/admin/settings/route.ts).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Team & access -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agency_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'agent'
    CHECK (role IN ('owner','admin','manager','operator','agent','viewer')),
  active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agency_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES agency_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_sessions_user_id_idx ON agency_sessions(user_id);
CREATE INDEX IF NOT EXISTS agency_sessions_expires_at_idx ON agency_sessions(expires_at);

-- Workspace settings --------------------------------------------------------

CREATE TABLE IF NOT EXISTS agency_settings (
  id text PRIMARY KEY DEFAULT 'default',
  agency_name text NOT NULL DEFAULT 'RCV Agency',
  website_url text,
  timezone text NOT NULL DEFAULT 'America/New_York',
  currency text NOT NULL DEFAULT 'USD',
  default_pipeline_stage text NOT NULL DEFAULT 'discovered',
  default_opportunity_value_cents integer NOT NULL DEFAULT 250000,
  default_opportunity_probability integer NOT NULL DEFAULT 50,
  notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The permanent business record --------------------------------------------

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  legal_name text,
  industry text,
  website_url text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  google_place_id text UNIQUE,
  status text NOT NULL DEFAULT 'discovered',
  opportunity_score integer,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS businesses_updated_at_idx ON businesses(updated_at DESC);
CREATE INDEX IF NOT EXISTS businesses_status_idx ON businesses(status);
CREATE INDEX IF NOT EXISTS businesses_email_lower_idx ON businesses(lower(email));

CREATE TABLE IF NOT EXISTS business_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_contacts_business_id_idx ON business_contacts(business_id);

CREATE TABLE IF NOT EXISTS business_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  summary text,
  services jsonb,
  competitors jsonb,
  reviews jsonb,
  brand_profile jsonb,
  research jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_research_business_id_idx ON business_research(business_id);

CREATE TABLE IF NOT EXISTS website_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url text,
  overall_score integer,
  design_score integer,
  mobile_score integer,
  performance_score integer,
  seo_score integer,
  accessibility_score integer,
  conversion_score integer,
  findings jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS website_audits_business_id_created_idx
  ON website_audits(business_id, created_at DESC);

-- Pipeline ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Website opportunity',
  stage text NOT NULL DEFAULT 'discovered',
  value_cents integer,
  probability integer,
  lost_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS opportunities_business_id_idx ON opportunities(business_id);
CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities(stage);

CREATE TABLE IF NOT EXISTS business_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  detail text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_activities_business_id_created_idx
  ON business_activities(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_activities_type_idx ON business_activities(type);

-- Delivery ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'onboarding',
  hosting_mode text CHECK (hosting_mode IN ('rcv_hosted','client_owned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'onboarding',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_business_id_idx ON projects(business_id);

CREATE TABLE IF NOT EXISTS production_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  domain text,
  repository_url text,
  deployment_url text,
  hosting_mode text CHECK (hosting_mode IN ('rcv_hosted','client_owned')),
  status text NOT NULL DEFAULT 'development',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS production_websites_business_id_idx ON production_websites(business_id);

-- Demos ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS demos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'generating',
  preview_url text,
  approved_at timestamptz,
  sent_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demos_business_id_idx ON demos(business_id);

CREATE TABLE IF NOT EXISTS demo_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id uuid NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demo_events_demo_id_idx ON demo_events(demo_id);
