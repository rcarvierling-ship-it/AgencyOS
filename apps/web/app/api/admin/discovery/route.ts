import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../lib/admin-auth'
import { withWrite } from '../../../../lib/crm'
import { readSettings } from '../../../../lib/settings'
import { isPipelineStage } from '../../../../lib/pipeline'
import { discoverBusinesses, DiscoveryError } from '../../../../lib/discovery'

export const runtime = 'nodejs'
export const maxDuration = 60

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'business'
}

export async function POST(request: Request) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })

  const body = await request.json().catch(() => null)
  const place = String(body?.city || '').trim()
  const category = String(body?.category || '').trim()
  const radius = Number(body?.radius || 25)
  if (!place || !category) return NextResponse.json({ error: 'A place and a service category are required' }, { status: 400 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 })

  try {
    const found = await discoverBusinesses({ place, category, radiusMiles: radius })

    const outcome = await withWrite(sql => sql.begin(async tx => {
      const settings = await readSettings(tx)
      const stage = isPipelineStage(settings.defaultPipelineStage) ? settings.defaultPipelineStage : 'discovered'
      let created = 0, duplicates = 0

      for (const b of found.businesses) {
        // Skip anything already known, whether by import reference or by the
        // same name in the same town from an earlier search.
        const existing = await tx<any[]>`
          select id from businesses
          where external_ref = ${b.osmId}
             or (lower(name) = lower(${b.name}) and coalesce(lower(city),'') = coalesce(lower(${b.city ?? ''}),''))
          limit 1`
        if (existing.length) { duplicates++; continue }

        let slug = slugify(b.name)
        const clash = await tx<any[]>`select id from businesses where slug=${slug} limit 1`
        if (clash.length) slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`

        const [row] = await tx<any[]>`
          insert into businesses (name,slug,industry,website_url,phone,address,city,state,postal_code,status,external_ref,metadata)
          values (${b.name},${slug},${category},${b.websiteUrl},${b.phone},${b.address},
                  ${b.city ?? null},${b.state ?? null},${b.postalCode ?? null},${stage},${b.osmId},
                  ${tx.json({ source: 'openstreetmap', osmId: b.osmId, lat: b.lat, lon: b.lon, discoveredBy: auth.user!.name, searchedPlace: found.place })})
          returning id`

        const [opportunity] = await tx<any[]>`
          insert into opportunities (business_id,name,stage,value_cents,probability)
          values (${row.id},'Website opportunity',${stage},${settings.defaultOpportunityValueCents},${settings.defaultOpportunityProbability})
          returning id`
        await tx`
          insert into business_activities (business_id,opportunity_id,type,title,detail,metadata)
          values (${row.id},${opportunity.id},'note','Discovered via OpenStreetMap',
                  ${`Found searching ${category} near ${found.place}${b.websiteUrl ? '.' : '. No website recorded in OpenStreetMap.'}`},
                  ${tx.json({ actor: auth.user!.name, osmId: b.osmId })})`
        created++
      }
      return { created, duplicates }
    }))

    return NextResponse.json({
      ...outcome,
      found: found.businesses.length,
      withoutWebsite: found.businesses.filter(b => !b.websiteUrl).length,
      place: found.place,
    })
  } catch (error) {
    if (error instanceof DiscoveryError) return NextResponse.json({ error: error.message }, { status: 422 })
    console.error('AgencyOS discovery failed', error)
    return NextResponse.json({ error: 'Discovery could not be completed' }, { status: 500 })
  }
}
