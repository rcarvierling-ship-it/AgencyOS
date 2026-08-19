import { NextResponse } from 'next/server'
import postgres from 'postgres'
import { readSettings } from '../../../lib/settings'

export const runtime = 'nodejs'

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || `business-${Date.now()}`
}

function clean(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Quiet bot trap: real visitors never see this field.
    if (clean(body.website, 200)) return NextResponse.json({ ok: true })

    const name = clean(body.name, 120)
    const businessName = clean(body.business, 160)
    const email = clean(body.email, 240).toLowerCase()
    const phone = clean(body.phone, 60)
    const currentWebsite = clean(body.currentWebsite, 500)
    const service = clean(body.service, 80) || 'new-website'
    const message = clean(body.message, 4000)

    if (!name || !businessName || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Please complete the required fields.' }, { status: 400 })
    }

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) return NextResponse.json({ error: 'Contact system is temporarily unavailable.' }, { status: 503 })

    const sql = postgres(databaseUrl, { prepare: false, max: 1 })
    try {
      const result = await sql.begin(async (tx) => {
        // Opportunity defaults come from the workspace settings so /admin/settings
        // governs real records rather than only describing them.
        const settings = await readSettings(tx)
        const existing = await tx<any[]>`select id,slug from businesses where lower(email)=lower(${email}) order by updated_at desc limit 1`
        let businessId: string
        let businessSlug: string

        if (existing[0]) {
          businessId = existing[0].id
          businessSlug = existing[0].slug
          await tx`update businesses set phone=coalesce(nullif(${phone},''),phone), website_url=coalesce(nullif(${currentWebsite},''),website_url), updated_at=now() where id=${businessId}`
        } else {
          const baseSlug = slugify(businessName)
          businessSlug = baseSlug
          const collision = await tx<any[]>`select id from businesses where slug=${baseSlug} limit 1`
          if (collision[0]) businessSlug = `${baseSlug}-${Math.random().toString(36).slice(2,7)}`
          const inserted = await tx<any[]>`insert into businesses (name,slug,website_url,phone,email,status,notes,metadata) values (${businessName},${businessSlug},nullif(${currentWebsite},''),nullif(${phone},''),${email},'contacted',${`Inbound website inquiry from ${name}.`},${tx.json({ source:'website_contact_form', contactName:name, service, message })}) returning id,slug`
          businessId = inserted[0].id
          businessSlug = inserted[0].slug
        }

        const contacts = await tx<any[]>`select id from business_contacts where business_id=${businessId} and lower(email)=lower(${email}) limit 1`
        if (!contacts[0]) {
          await tx`insert into business_contacts (business_id,name,email,phone,source) values (${businessId},${name},${email},nullif(${phone},''),'website_contact_form')`
        }

        const activeOpportunity = await tx<any[]>`select id from opportunities where business_id=${businessId} and stage not in ('won','lost') order by updated_at desc limit 1`
        let opportunityId: string
        if (activeOpportunity[0]) {
          opportunityId = activeOpportunity[0].id
          await tx`update opportunities set stage='contacted', updated_at=now() where id=${opportunityId}`
        } else {
          // An inbound inquiry is by definition already at 'contacted'; the
          // configured default stage governs discovered leads, not these.
          const opportunity = await tx<any[]>`insert into opportunities (business_id,name,stage,value_cents,probability) values (${businessId},'Website project inquiry','contacted',${settings.defaultOpportunityValueCents},${settings.defaultOpportunityProbability}) returning id`
          opportunityId = opportunity[0].id
        }

        await tx`insert into business_activities (business_id,opportunity_id,type,title,detail,metadata) values (${businessId},${opportunityId},'inbound_contact','New website project inquiry',${message},${tx.json({ source:'website_contact_form', contactName:name, email, phone, service, currentWebsite })})`
        return { businessSlug }
      })

      return NextResponse.json({ ok: true, ...result })
    } finally {
      await sql.end({ timeout: 2 }).catch(() => undefined)
    }
  } catch {
    return NextResponse.json({ error: 'Unable to submit your inquiry right now.' }, { status: 500 })
  }
}
