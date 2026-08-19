import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../../lib/admin-auth'
import { withWrite } from '../../../../../../lib/crm'
import { buildDemoContent, demoSlug } from '../../../../../../lib/demo'

export const runtime = 'nodejs'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })

  try {
    const { id } = await params
    const demo = await withWrite(sql => sql.begin(async tx => {
      const [business] = await tx<any[]>`
        select id,name,industry,city,state,phone,email,website_url as "websiteUrl" from businesses where id=${id}`
      if (!business) throw new Error('Business not found')

      // Any services already researched take precedence over industry defaults.
      const [research] = await tx<any[]>`select services from business_research where business_id=${id} order by created_at desc limit 1`
      const recorded = Array.isArray(research?.services)
        ? research.services.filter((s: unknown) => typeof s === 'string')
        : null

      const content = buildDemoContent(business, recorded)
      const [opportunity] = await tx<any[]>`
        select id from opportunities where business_id=${id} and stage not in ('won','lost') order by updated_at desc limit 1`

      // A fresh slug per generation keeps older concept links working and
      // stops a regenerate from silently changing what a prospect already saw.
      const slug = demoSlug(business.name, Math.random().toString(36).slice(2, 8))
      const [row] = await tx<any[]>`
        insert into demos (business_id,opportunity_id,slug,status,preview_url,metadata)
        values (${id},${opportunity?.id ?? null},${slug},'ready',${'/demo/' + slug},${tx.json({ content, generatedBy: auth.user!.name })})
        returning id,slug,status`

      await tx`update businesses set status=case when status in ('discovered','qualified','researching') then 'demo_ready' else status end, updated_at=now() where id=${id}`
      if (opportunity?.id) {
        await tx`update opportunities set stage=case when stage in ('discovered','qualified','researching') then 'demo_ready' else stage end, updated_at=now() where id=${opportunity.id}`
      }
      await tx`
        insert into business_activities (business_id,opportunity_id,type,title,detail,metadata)
        values (${id},${opportunity?.id ?? null},'note','Demo concept generated',
                ${`Concept created at /demo/${slug} by ${auth.user!.name}. Review before any outreach.`},
                ${tx.json({ actor: auth.user!.name, demoSlug: slug })})`
      return row
    }))
    return NextResponse.json({ demo }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to generate the concept' }, { status: 400 })
  }
}
