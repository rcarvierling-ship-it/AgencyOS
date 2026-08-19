import postgres from 'postgres'
import { readSettings } from './settings'
import { isPipelineStage } from './pipeline'

export type Sql = ReturnType<typeof postgres>

export function db(): Sql | null {
  const url = process.env.DATABASE_URL
  return url ? postgres(url, { prepare: false, max: 1 }) : null
}

/** Runs work on a short-lived connection and always closes it. */
export async function withWrite<T>(work: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = db()
  if (!sql) throw new Error('Database is not configured')
  try {
    return await work(sql)
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined)
  }
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)
}

export function clean(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/** Turns a name into a slug that is free in the businesses table. */
async function uniqueSlug(tx: postgres.ISql, name: string) {
  const base = slugify(name) || 'business'
  const taken = await tx<{ slug: string }[]>`select slug from businesses where slug = ${base} or slug like ${base + '-%'}`
  if (!taken.some(row => row.slug === base)) return base
  const used = new Set(taken.map(row => row.slug))
  for (let n = 2; n < 200; n++) {
    const candidate = `${base}-${n}`
    if (!used.has(candidate)) return candidate
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}

export { ACTIVITY_TYPES, type ActivityType } from './crm-constants'
import { ACTIVITY_TYPES } from './crm-constants'

export type BusinessInput = {
  name?: unknown; industry?: unknown; websiteUrl?: unknown; phone?: unknown; email?: unknown
  address?: unknown; city?: unknown; state?: unknown; postalCode?: unknown; notes?: unknown
  opportunityScore?: unknown; status?: unknown
}

function normalizeBusiness(input: BusinessInput) {
  const email = clean(input.email, 240).toLowerCase()
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email address is not valid')
  let websiteUrl = clean(input.websiteUrl, 500)
  // Accept "acme.com" as readily as a full URL — nobody types the scheme.
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`

  let score: number | null = null
  if (input.opportunityScore !== undefined && input.opportunityScore !== null && input.opportunityScore !== '') {
    score = Math.round(Number(input.opportunityScore))
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('Opportunity score must be between 0 and 100')
  }
  return {
    name: clean(input.name, 160), industry: clean(input.industry, 120), websiteUrl,
    phone: clean(input.phone, 60), email, address: clean(input.address, 240),
    city: clean(input.city, 120), state: clean(input.state, 60), postalCode: clean(input.postalCode, 20),
    notes: clean(input.notes, 4000), opportunityScore: score,
  }
}

/**
 * Creates a business plus its opening opportunity and a record of how it
 * entered the system. Everything happens in one transaction so a business can
 * never exist without the trail that explains it.
 */
export async function createBusiness(input: BusinessInput, actor: string) {
  const fields = normalizeBusiness(input)
  if (!fields.name) throw new Error('A business name is required')

  return withWrite(sql => sql.begin(async tx => {
    const settings = await readSettings(tx)
    const slug = await uniqueSlug(tx, fields.name)
    const stage = isPipelineStage(settings.defaultPipelineStage) ? settings.defaultPipelineStage : 'discovered'

    const [business] = await tx<any[]>`
      insert into businesses (name,slug,industry,website_url,phone,email,address,city,state,postal_code,status,opportunity_score,notes,metadata)
      values (${fields.name},${slug},${fields.industry || null},${fields.websiteUrl || null},${fields.phone || null},
              ${fields.email || null},${fields.address || null},${fields.city || null},${fields.state || null},
              ${fields.postalCode || null},${stage},${fields.opportunityScore},${fields.notes || null},
              ${JSON.stringify({ source: 'manual', createdBy: actor })}::jsonb)
      returning id, slug, name`

    const [opportunity] = await tx<any[]>`
      insert into opportunities (business_id,name,stage,value_cents,probability)
      values (${business.id},'Website opportunity',${stage},${settings.defaultOpportunityValueCents},${settings.defaultOpportunityProbability})
      returning id`

    await tx`
      insert into business_activities (business_id,opportunity_id,type,title,detail,metadata)
      values (${business.id},${opportunity.id},'note','Business added',${`Added to AgencyOS by ${actor}.`},
              ${JSON.stringify({ source: 'manual', actor })}::jsonb)`

    return business as { id: string; slug: string; name: string }
  }))
}

export async function updateBusiness(id: string, input: BusinessInput, actor: string) {
  const fields = normalizeBusiness(input)
  if (!fields.name) throw new Error('A business name is required')
  const status = clean(input.status, 40)
  if (status && !isPipelineStage(status)) throw new Error('That status is not a valid pipeline stage')

  return withWrite(async sql => {
    const [business] = await sql<any[]>`
      update businesses set
        name=${fields.name}, industry=${fields.industry || null}, website_url=${fields.websiteUrl || null},
        phone=${fields.phone || null}, email=${fields.email || null}, address=${fields.address || null},
        city=${fields.city || null}, state=${fields.state || null}, postal_code=${fields.postalCode || null},
        notes=${fields.notes || null}, opportunity_score=${fields.opportunityScore},
        status=coalesce(${status || null},status), updated_at=now()
      where id=${id}
      returning id, slug, name`
    if (!business) throw new Error('Business not found')

    await sql`
      insert into business_activities (business_id,type,title,detail,metadata)
      values (${id},'note','Business details updated',${`Updated by ${actor}.`},${JSON.stringify({ actor })}::jsonb)`
    return business as { id: string; slug: string; name: string }
  })
}

export async function addContact(businessId: string, input: { name?: unknown; role?: unknown; email?: unknown; phone?: unknown }, actor: string) {
  const name = clean(input.name, 160)
  const email = clean(input.email, 240).toLowerCase()
  if (!name) throw new Error('A contact name is required')
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email address is not valid')

  return withWrite(sql => sql.begin(async tx => {
    const [exists] = await tx<any[]>`select id from businesses where id=${businessId}`
    if (!exists) throw new Error('Business not found')
    const [contact] = await tx<any[]>`
      insert into business_contacts (business_id,name,role,email,phone,source)
      values (${businessId},${name},${clean(input.role, 120) || null},${email || null},${clean(input.phone, 60) || null},'manual')
      returning id,name`
    await tx`
      insert into business_activities (business_id,type,title,detail,metadata)
      values (${businessId},'note','Contact added',${`${name} added by ${actor}.`},${JSON.stringify({ actor })}::jsonb)`
    return contact
  }))
}

export async function logActivity(businessId: string, input: { type?: unknown; title?: unknown; detail?: unknown }, actor: string) {
  const type = clean(input.type, 40) || 'note'
  const title = clean(input.title, 200)
  if (!(ACTIVITY_TYPES as readonly string[]).includes(type)) throw new Error('That activity type is not recognized')
  if (!title) throw new Error('A short title is required')

  return withWrite(sql => sql.begin(async tx => {
    const [exists] = await tx<any[]>`select id from businesses where id=${businessId}`
    if (!exists) throw new Error('Business not found')
    const [opportunity] = await tx<any[]>`
      select id from opportunities where business_id=${businessId} and stage not in ('won','lost') order by updated_at desc limit 1`
    const [activity] = await tx<any[]>`
      insert into business_activities (business_id,opportunity_id,type,title,detail,metadata)
      values (${businessId},${opportunity?.id ?? null},${type},${title},${clean(input.detail, 4000) || null},${JSON.stringify({ actor })}::jsonb)
      returning id`
    return activity
  }))
}

/**
 * A won opportunity should not dead-end. Promotes the business to a client and
 * opens the delivery project, which is what /admin/clients and /admin/projects
 * have always read from but nothing ever wrote.
 */
export async function convertWonOpportunity(tx: postgres.ISql, opportunityId: string, actor: string) {
  const [row] = await tx<any[]>`
    select o.id, o.business_id as "businessId", b.name from opportunities o
    join businesses b on b.id = o.business_id where o.id = ${opportunityId}`
  if (!row) return null

  const [existingClient] = await tx<any[]>`select id from clients where business_id=${row.businessId}`
  let clientId = existingClient?.id as string | undefined
  if (!clientId) {
    const [client] = await tx<any[]>`
      insert into clients (business_id,status) values (${row.businessId},'onboarding')
      on conflict (business_id) do update set updated_at=now()
      returning id`
    clientId = client.id
  }

  const existingProject = await tx<any[]>`select id from projects where business_id=${row.businessId} and status not in ('complete','cancelled') limit 1`
  if (!existingProject.length && clientId) {
    await tx`
      insert into projects (business_id,client_id,name,status)
      values (${row.businessId},${clientId},${row.name + ' website'},'onboarding')`
  }

  await tx`update businesses set status='won', updated_at=now() where id=${row.businessId}`
  await tx`
    insert into business_activities (business_id,opportunity_id,type,title,detail,metadata)
    values (${row.businessId},${opportunityId},'note','Opportunity won',${`Client and delivery project created by ${actor}.`},${JSON.stringify({ actor })}::jsonb)`
  return { clientId }
}
