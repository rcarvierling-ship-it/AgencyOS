import postgres from 'postgres'

export type BusinessRow = { id: string; name: string; slug: string; industry: string | null; websiteUrl: string | null; city: string | null; state: string | null; status: string; opportunityScore: number | null }

function sqlClient() {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return postgres(url, { prepare: false, max: 1 })
}

export async function withDb<T>(work: (sql: ReturnType<typeof postgres>) => Promise<T>, fallback: T): Promise<T> {
  const sql = sqlClient()
  if (!sql) return fallback
  try { return await work(sql) } catch { return fallback } finally { await sql.end({ timeout: 2 }).catch(() => undefined) }
}

export async function getBusinesses(limit = 100) {
  return withDb(async sql => sql<BusinessRow[]>`
    select id, name, slug, industry, website_url as "websiteUrl", city, state, status, opportunity_score as "opportunityScore"
    from businesses order by updated_at desc limit ${limit}
  `, [])
}

export async function getCounts() {
  return withDb(async sql => {
    const [r] = await sql<any[]>`
      select
        (select count(*)::int from businesses) as businesses,
        (select count(*)::int from opportunities where stage not in ('won','lost')) as opportunities,
        (select count(*)::int from demos where status in ('ready','approved')) as demos_ready,
        (select count(*)::int from clients) as clients,
        (select count(*)::int from projects where status not in ('complete','cancelled')) as active_projects,
        (select count(*)::int from production_websites) as websites,
        (select count(*)::int from production_websites where hosting_mode is not null) as hosted_websites
    `
    return r ?? { businesses: 0, opportunities: 0, demos_ready: 0, clients: 0, active_projects: 0, websites: 0, hosted_websites: 0 }
  }, { businesses: 0, opportunities: 0, demos_ready: 0, clients: 0, active_projects: 0, websites: 0, hosted_websites: 0 })
}

export async function getPipeline() {
  return withDb(async sql => sql<any[]>`
    select o.stage, count(*)::int as count,
      coalesce(json_agg(json_build_object('name', b.name, 'slug', b.slug, 'score', b.opportunity_score) order by b.updated_at desc) filter (where b.id is not null), '[]') as businesses
    from opportunities o join businesses b on b.id = o.business_id
    group by o.stage order by array_position(array['discovered','qualified','researching','demo_ready','contacted','interested','proposal','won','lost']::text[], o.stage)
  `, [])
}

export async function getDemos() {
  return withDb(async sql => sql<any[]>`
    select d.id, d.slug, d.status, d.preview_url as "previewUrl", d.created_at as "createdAt", b.name, b.slug as "businessSlug", b.opportunity_score as score
    from demos d join businesses b on b.id = d.business_id order by d.created_at desc limit 100
  `, [])
}

export async function getOutreach() {
  return withDb(async sql => sql<any[]>`
    select a.id, a.type, a.title, a.detail, a.created_at as "createdAt", b.name, b.slug
    from business_activities a join businesses b on b.id = a.business_id
    where a.type in ('outreach','email','follow_up','proposal') or a.title ilike '%email%' or a.title ilike '%outreach%'
    order by a.created_at desc limit 100
  `, [])
}

export async function getClients() {
  return withDb(async sql => sql<any[]>`
    select c.id, c.status, c.hosting_mode as "hostingMode", b.name, b.slug, b.industry,
      (select count(*)::int from projects p where p.client_id = c.id) as projects,
      (select count(*)::int from production_websites w where w.business_id = b.id) as websites
    from clients c join businesses b on b.id = c.business_id order by c.updated_at desc limit 100
  `, [])
}

export async function getProjects() {
  return withDb(async sql => sql<any[]>`
    select p.id, p.name, p.status, p.created_at as "createdAt", b.name as business, b.slug,
      c.status as "clientStatus"
    from projects p join businesses b on b.id = p.business_id left join clients c on c.id = p.client_id
    order by p.updated_at desc limit 100
  `, [])
}

export async function getWebsites() {
  return withDb(async sql => sql<any[]>`
    select w.id, w.domain, w.status, w.hosting_mode as "hostingMode", w.deployment_url as "deploymentUrl",
      w.repository_url as "repositoryUrl", b.name as business, b.slug
    from production_websites w join businesses b on b.id = w.business_id order by w.updated_at desc limit 100
  `, [])
}

export async function getAnalytics() {
  return withDb(async sql => {
    const [r] = await sql<any[]>`
      select
        (select count(*)::int from businesses) as leads,
        (select count(*)::int from opportunities where stage = 'qualified') as qualified,
        (select count(*)::int from demos) as demos,
        (select count(*)::int from clients) as clients,
        (select count(*)::int from projects) as projects,
        (select count(*)::int from production_websites) as websites
    `
    return r ?? { leads: 0, qualified: 0, demos: 0, clients: 0, projects: 0, websites: 0 }
  }, { leads: 0, qualified: 0, demos: 0, clients: 0, projects: 0, websites: 0 })
}
