import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { requireApiUser } from '../../../../lib/admin-auth'
import { ALL_PIPELINE_STAGES, SETTINGS_DEFAULTS, normalizeSettings } from '../../../../lib/settings'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function db() {
  const url = process.env.DATABASE_URL
  return url ? postgres(url, { prepare: false, max: 1 }) : null
}

async function ensureTable(sql: ReturnType<typeof postgres>) {
  await sql`CREATE TABLE IF NOT EXISTS agency_settings (id text PRIMARY KEY DEFAULT 'default', agency_name text NOT NULL DEFAULT 'RCV Agency', website_url text, timezone text NOT NULL DEFAULT 'America/New_York', currency text NOT NULL DEFAULT 'USD', default_pipeline_stage text NOT NULL DEFAULT 'discovered', default_opportunity_value_cents integer NOT NULL DEFAULT 250000, default_opportunity_probability integer NOT NULL DEFAULT 50, notifications jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`
}

export async function GET() {
  const auth = await requireApiUser()
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  const sql = db()
  if (!sql) return NextResponse.json(SETTINGS_DEFAULTS)
  try {
    await ensureTable(sql)
    const rows = await sql<Record<string, unknown>[]>`SELECT * FROM agency_settings WHERE id='default' LIMIT 1`
    return NextResponse.json(normalizeSettings(rows[0]))
  } catch (error) {
    console.error('AgencyOS settings GET failed', error)
    return NextResponse.json({ error: 'Unable to load settings' }, { status: 500 })
  } finally {
    await sql.end({ timeout: 2 }).catch(() => undefined)
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireApiUser(['owner', 'admin'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  const sql = db()
  if (!sql) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 })
  try {
    await ensureTable(sql)
    const body = await request.json()
    const agencyName = String(body.agencyName ?? '').trim()
    const websiteUrl = String(body.websiteUrl ?? '').trim()
    const postalAddress = String(body.postalAddress ?? '').trim().slice(0, 300)
    const timezone = String(body.timezone ?? '').trim()
    const currency = String(body.currency ?? '').trim().toUpperCase()
    const defaultPipelineStage = String(body.defaultPipelineStage ?? '').trim()
    const defaultOpportunityValueCents = Math.round(Number(body.defaultOpportunityValueCents))
    const defaultOpportunityProbability = Math.round(Number(body.defaultOpportunityProbability))
    const notifications = body.notifications && typeof body.notifications === 'object' ? body.notifications : SETTINGS_DEFAULTS.notifications

    if (!agencyName || !timezone || !currency || !defaultPipelineStage) {
      return NextResponse.json({ error: 'Agency name, timezone, currency, and default pipeline stage are required.' }, { status: 400 })
    }
    // These now steer real record creation, so reject values the rest of the
    // application could not act on.
    if (!(ALL_PIPELINE_STAGES as readonly string[]).includes(defaultPipelineStage)) {
      return NextResponse.json({ error: 'That default pipeline stage is not a valid stage.' }, { status: 400 })
    }
    if (!isValidTimezone(timezone)) {
      return NextResponse.json({ error: 'That timezone is not recognized.' }, { status: 400 })
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: 'Currency must be a three-letter code, such as USD.' }, { status: 400 })
    }
    if (!Number.isFinite(defaultOpportunityValueCents) || defaultOpportunityValueCents < 0) {
      return NextResponse.json({ error: 'Default opportunity value must be a valid non-negative number.' }, { status: 400 })
    }
    if (!Number.isFinite(defaultOpportunityProbability) || defaultOpportunityProbability < 0 || defaultOpportunityProbability > 100) {
      return NextResponse.json({ error: 'Default probability must be between 0 and 100.' }, { status: 400 })
    }

    const rows = await sql<Record<string, unknown>[]>`INSERT INTO agency_settings (id,agency_name,website_url,postal_address,timezone,currency,default_pipeline_stage,default_opportunity_value_cents,default_opportunity_probability,notifications,updated_at) VALUES ('default',${agencyName},${websiteUrl || null},${postalAddress || null},${timezone},${currency},${defaultPipelineStage},${defaultOpportunityValueCents},${defaultOpportunityProbability},${sql!.json(notifications)},now()) ON CONFLICT (id) DO UPDATE SET agency_name=EXCLUDED.agency_name,website_url=EXCLUDED.website_url,postal_address=EXCLUDED.postal_address,timezone=EXCLUDED.timezone,currency=EXCLUDED.currency,default_pipeline_stage=EXCLUDED.default_pipeline_stage,default_opportunity_value_cents=EXCLUDED.default_opportunity_value_cents,default_opportunity_probability=EXCLUDED.default_opportunity_probability,notifications=EXCLUDED.notifications,updated_at=now() RETURNING *`
    return NextResponse.json(normalizeSettings(rows[0]))
  } catch (error) {
    console.error('AgencyOS settings PUT failed', error)
    return NextResponse.json({ error: 'Unable to save settings' }, { status: 500 })
  } finally {
    await sql.end({ timeout: 2 }).catch(() => undefined)
  }
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}
