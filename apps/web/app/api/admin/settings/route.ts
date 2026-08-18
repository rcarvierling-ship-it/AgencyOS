import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

export const dynamic = 'force-dynamic'

const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { prepare: false, max: 1 })
  : null

const DEFAULTS = {
  id: 'default',
  agencyName: 'RCV Agency',
  websiteUrl: 'https://rcvagency.com',
  timezone: 'America/New_York',
  currency: 'USD',
  defaultPipelineStage: 'discovered',
  defaultOpportunityValueCents: 250000,
  defaultOpportunityProbability: 50,
  notifications: {
    newBusiness: true,
    demoReady: true,
    outreachReply: true,
    pipelineMovement: false,
    clientActivity: true,
  },
}

async function ensureTable() {
  if (!sql) throw new Error('DATABASE_URL is not configured')
  await sql`
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
    )
  `
}

function normalize(row: Record<string, unknown>) {
  const notifications = typeof row.notifications === 'object' && row.notifications !== null
    ? row.notifications as Record<string, boolean>
    : {}

  return {
    id: String(row.id ?? DEFAULTS.id),
    agencyName: String(row.agency_name ?? DEFAULTS.agencyName),
    websiteUrl: String(row.website_url ?? DEFAULTS.websiteUrl),
    timezone: String(row.timezone ?? DEFAULTS.timezone),
    currency: String(row.currency ?? DEFAULTS.currency),
    defaultPipelineStage: String(row.default_pipeline_stage ?? DEFAULTS.defaultPipelineStage),
    defaultOpportunityValueCents: Number(row.default_opportunity_value_cents ?? DEFAULTS.defaultOpportunityValueCents),
    defaultOpportunityProbability: Number(row.default_opportunity_probability ?? DEFAULTS.defaultOpportunityProbability),
    notifications: {
      ...DEFAULTS.notifications,
      ...notifications,
    },
  }
}

export async function GET() {
  try {
    await ensureTable()
    const rows = await sql!`SELECT * FROM agency_settings WHERE id = 'default' LIMIT 1`
    if (!rows[0]) return NextResponse.json(DEFAULTS)
    return NextResponse.json(normalize(rows[0]))
  } catch (error) {
    console.error('AgencyOS settings GET failed', error)
    return NextResponse.json({ error: 'Unable to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTable()
    const body = await request.json()
    const agencyName = String(body.agencyName ?? '').trim()
    const websiteUrl = String(body.websiteUrl ?? '').trim()
    const timezone = String(body.timezone ?? '').trim()
    const currency = String(body.currency ?? '').trim().toUpperCase()
    const defaultPipelineStage = String(body.defaultPipelineStage ?? '').trim()
    const defaultOpportunityValueCents = Math.round(Number(body.defaultOpportunityValueCents))
    const defaultOpportunityProbability = Math.round(Number(body.defaultOpportunityProbability))
    const notifications = body.notifications && typeof body.notifications === 'object' ? body.notifications : DEFAULTS.notifications

    if (!agencyName || !timezone || !currency || !defaultPipelineStage) {
      return NextResponse.json({ error: 'Agency name, timezone, currency, and default pipeline stage are required.' }, { status: 400 })
    }
    if (!Number.isFinite(defaultOpportunityValueCents) || defaultOpportunityValueCents < 0) {
      return NextResponse.json({ error: 'Default opportunity value must be a valid non-negative number.' }, { status: 400 })
    }
    if (!Number.isFinite(defaultOpportunityProbability) || defaultOpportunityProbability < 0 || defaultOpportunityProbability > 100) {
      return NextResponse.json({ error: 'Default probability must be between 0 and 100.' }, { status: 400 })
    }

    const rows = await sql!`
      INSERT INTO agency_settings (
        id, agency_name, website_url, timezone, currency,
        default_pipeline_stage, default_opportunity_value_cents,
        default_opportunity_probability, notifications, updated_at
      ) VALUES (
        'default', ${agencyName}, ${websiteUrl || null}, ${timezone}, ${currency},
        ${defaultPipelineStage}, ${defaultOpportunityValueCents},
        ${defaultOpportunityProbability}, ${JSON.stringify(notifications)}::jsonb, now()
      )
      ON CONFLICT (id) DO UPDATE SET
        agency_name = EXCLUDED.agency_name,
        website_url = EXCLUDED.website_url,
        timezone = EXCLUDED.timezone,
        currency = EXCLUDED.currency,
        default_pipeline_stage = EXCLUDED.default_pipeline_stage,
        default_opportunity_value_cents = EXCLUDED.default_opportunity_value_cents,
        default_opportunity_probability = EXCLUDED.default_opportunity_probability,
        notifications = EXCLUDED.notifications,
        updated_at = now()
      RETURNING *
    `

    return NextResponse.json(normalize(rows[0]))
  } catch (error) {
    console.error('AgencyOS settings PUT failed', error)
    return NextResponse.json({ error: 'Unable to save settings' }, { status: 500 })
  }
}
