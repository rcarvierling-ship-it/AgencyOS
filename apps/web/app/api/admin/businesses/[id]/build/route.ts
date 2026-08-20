import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../../lib/admin-auth'
import { withWrite } from '../../../../../../lib/crm'
import { researchWebsite } from '../../../../../../lib/research'
import { buildBrief, chooseVariation } from '../../../../../../lib/demo-brief'
import { demoSlug } from '../../../../../../lib/demo'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })

  try {
    const { id } = await params
    const business = await withWrite(async sql => {
      const [row] = await sql<any[]>`
        select id,name,industry,city,state,phone,email,website_url as "websiteUrl",notes from businesses where id=${id}`
      return row
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Research runs outside the transaction: it is a network call to a third
    // party and must not hold a database transaction open while it waits.
    let research = null
    let researchError: string | null = null
    if (business.websiteUrl) {
      try { research = await researchWebsite(business.websiteUrl) }
      catch (error) { researchError = error instanceof Error ? error.message : 'Their site could not be read' }
    }

    const queued = await withWrite(sql => sql.begin(async tx => {
      if (research) {
        await tx`
          insert into business_research (business_id,summary,services,brand_profile,research,source)
          values (${business.id},${research.about},${tx.json(research.services)},
                  ${tx.json({ colors: research.brandColors, images: research.images, socials: research.socials })},
                  ${tx.json(research)},'website')`
      }

      const [audit] = await tx<any[]>`select findings from website_audits where business_id=${id} order by created_at desc limit 1`
      const auditFailures = (audit?.findings?.checks ?? [])
        .filter((c: any) => c.status === 'fail')
        .map((c: any) => ({ label: c.label, detail: c.detail }))

      // Archetypes in use anywhere, so concepts differ across the whole book.
      const priorRows = await tx<any[]>`select variation->>'archetype' as a from demo_builds where variation->>'archetype' is not null order by created_at desc limit 20`
      const used = [...new Set(priorRows.map(r => r.a).filter(Boolean))] as string[]

      const slug = demoSlug(business.name, Math.random().toString(36).slice(2, 8))
      const variation = chooseVariation(used, business.id + slug)
      const brief = buildBrief({
        business, research, auditFailures, usedArchetypes: used, demoSlug: slug,
      }, variation)

      const [demo] = await tx<any[]>`
        insert into demos (business_id,slug,status,preview_url,metadata)
        values (${business.id},${slug},'generating',${'/demo/' + slug},${tx.json({ builtBy: 'claude-code', variation, queuedBy: auth.user!.name })})
        returning id,slug`

      const [build] = await tx<any[]>`
        insert into demo_builds (business_id,demo_id,status,brief,variation)
        values (${business.id},${demo.id},'queued',${brief},${tx.json(variation)})
        returning id,status`

      await tx`
        insert into business_activities (business_id,type,title,detail,metadata)
        values (${business.id},'note','Mockup build queued',
                ${`Queued for Claude Code by ${auth.user!.name}. Archetype: ${variation.archetypeName}.${researchError ? ` Their site could not be read: ${researchError}` : ''}`},
                ${tx.json({ actor: auth.user!.name, variation })})`

      return { buildId: build.id, demoSlug: demo.slug, variation, briefLength: brief.length }
    }))

    return NextResponse.json({ ...queued, researchError, researched: Boolean(research) }, { status: 201 })
  } catch (error) {
    console.error('AgencyOS build queue failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to queue the build' }, { status: 400 })
  }
}
