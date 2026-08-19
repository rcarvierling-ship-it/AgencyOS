-- Repairs JSONB values that were stored double-encoded.
--
-- Writes used ${JSON.stringify(value)}::jsonb, but postgres.js already
-- serializes parameters bound to a json column. The value was therefore
-- encoded twice and landed as a JSON *string* rather than an object, so
-- every read of it came back as text: inquiry metadata never resolved a
-- contact name, and saved notification preferences silently fell back to
-- defaults on load.
--
-- Only values whose jsonb_typeof is 'string' are touched, so this is safe
-- to re-run and leaves correctly-stored rows alone.

DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('businesses',          'metadata'),
      ('business_activities', 'metadata'),
      ('business_research',   'services'),
      ('business_research',   'competitors'),
      ('business_research',   'reviews'),
      ('business_research',   'brand_profile'),
      ('business_research',   'research'),
      ('website_audits',      'findings'),
      ('demos',               'metadata'),
      ('demo_events',         'metadata'),
      ('agency_settings',     'notifications')
    ) AS t(table_name, column_name)
  LOOP
    EXECUTE format(
      'UPDATE %I SET %I = (%I #>> ''{}'')::jsonb
        WHERE %I IS NOT NULL AND jsonb_typeof(%I) = ''string''',
      target.table_name, target.column_name, target.column_name,
      target.column_name, target.column_name
    );
  END LOOP;
END $$;
