import postgres from 'postgres'
import { ALL_PIPELINE_STAGES, isPipelineStage } from './pipeline'

export type AgencySettings = {
  id: string
  agencyName: string
  websiteUrl: string
  postalAddress: string | null
  timezone: string
  currency: string
  defaultPipelineStage: string
  defaultOpportunityValueCents: number
  defaultOpportunityProbability: number
  notifications: Record<string, boolean>
}

export { ALL_PIPELINE_STAGES }

export const SETTINGS_DEFAULTS: AgencySettings = {
  id: 'default',
  agencyName: 'RCV Agency',
  websiteUrl: 'https://rcvagency.com',
  postalAddress: null,
  timezone: 'America/New_York',
  currency: 'USD',
  defaultPipelineStage: 'discovered',
  defaultOpportunityValueCents: 250000,
  defaultOpportunityProbability: 50,
  notifications: { newBusiness: true, demoReady: true, outreachReply: true, pipelineMovement: false, clientActivity: true },
}

export function normalizeSettings(row: Record<string, unknown> | undefined): AgencySettings {
  if (!row) return SETTINGS_DEFAULTS
  const notifications = typeof row.notifications === 'object' && row.notifications !== null
    ? row.notifications as Record<string, boolean>
    : {}
  const stage = String(row.default_pipeline_stage ?? SETTINGS_DEFAULTS.defaultPipelineStage)
  return {
    id: String(row.id ?? SETTINGS_DEFAULTS.id),
    agencyName: String(row.agency_name ?? SETTINGS_DEFAULTS.agencyName),
    websiteUrl: String(row.website_url ?? SETTINGS_DEFAULTS.websiteUrl),
    postalAddress: row.postal_address ? String(row.postal_address) : null,
    timezone: String(row.timezone ?? SETTINGS_DEFAULTS.timezone),
    currency: String(row.currency ?? SETTINGS_DEFAULTS.currency),
    // Guard against a stage that was valid when saved but has since been removed.
    defaultPipelineStage: isPipelineStage(stage) ? stage : SETTINGS_DEFAULTS.defaultPipelineStage,
    defaultOpportunityValueCents: Number(row.default_opportunity_value_cents ?? SETTINGS_DEFAULTS.defaultOpportunityValueCents),
    defaultOpportunityProbability: Number(row.default_opportunity_probability ?? SETTINGS_DEFAULTS.defaultOpportunityProbability),
    notifications: { ...SETTINGS_DEFAULTS.notifications, ...notifications },
  }
}

// Either a pooled client or a transaction handle, so callers can read settings
// inside the same transaction that writes the records those settings configure.
type Queryable = postgres.ISql

/** Reads settings on an existing connection — use inside a transaction or route. */
export async function readSettings(sql: Queryable): Promise<AgencySettings> {
  try {
    const rows = await sql<Record<string, unknown>[]>`select * from agency_settings where id='default' limit 1`
    return normalizeSettings(rows[0])
  } catch {
    return SETTINGS_DEFAULTS
  }
}

/** Reads settings on its own short-lived connection. Falls back to defaults. */
export async function getAgencySettings(): Promise<AgencySettings> {
  const url = process.env.DATABASE_URL
  if (!url) return SETTINGS_DEFAULTS
  const sql = postgres(url, { prepare: false, max: 1 })
  try {
    return await readSettings(sql)
  } finally {
    await sql.end({ timeout: 2 }).catch(() => undefined)
  }
}

// Formatting -----------------------------------------------------------------
// Every admin timestamp goes through these so the workspace timezone setting
// actually governs what the team sees, rather than the server's locale.

export function formatDateTime(value: string | number | Date | null | undefined, settings: Pick<AgencySettings, 'timezone'>) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: settings.timezone,
  }).format(date)
}

export function formatDate(value: string | number | Date | null | undefined, settings: Pick<AgencySettings, 'timezone'>) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: settings.timezone }).format(date)
}

export function formatMoney(cents: number | null | undefined, settings: Pick<AgencySettings, 'currency'>) {
  if (cents == null || !Number.isFinite(Number(cents))) return '—'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: settings.currency, maximumFractionDigits: 0,
    }).format(Number(cents) / 100)
  } catch {
    // An unrecognized currency code should not take a page down.
    return `${(Number(cents) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${settings.currency}`
  }
}
