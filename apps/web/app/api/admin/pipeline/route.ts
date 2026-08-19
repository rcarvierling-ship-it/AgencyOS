import { NextResponse } from 'next/server'
import postgres from 'postgres'
import { requireApiUser } from '../../../../lib/admin-auth'
import { isPipelineStage, stageLabel } from '../../../../lib/pipeline'
import { convertWonOpportunity } from '../../../../lib/crm'

export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const { opportunityId, stage } = await request.json()
    if (typeof opportunityId !== 'string' || !isPipelineStage(stage)) {
      return NextResponse.json({ error: 'Invalid pipeline update' }, { status: 400 })
    }
    const url = process.env.DATABASE_URL
    if (!url) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 })

    const sql = postgres(url, { prepare: false, max: 1 })
    try {
      const result = await sql.begin(async (tx) => {
        const [current] = await tx<any[]>`select stage, business_id as "businessId" from opportunities where id=${opportunityId}`
        if (!current) return { missing: true as const }
        if (current.stage === stage) return { unchanged: true as const }

        await tx`update opportunities set stage=${stage}, updated_at=now() where id=${opportunityId}`

        // Keep the business record's own stage aligned with its live opportunity.
        if (stage !== 'won') {
          await tx`update businesses set status=${stage}, updated_at=now() where id=${current.businessId}`
        }
        await tx`
          insert into business_activities (business_id,opportunity_id,type,title,detail,metadata)
          values (${current.businessId},${opportunityId},'note','Pipeline stage changed',
                  ${`${stageLabel(current.stage)} → ${stageLabel(stage)}, by ${auth.user!.name}.`},
                  ${tx.json({ from: current.stage, to: stage, actor: auth.user!.name })})`

        // Winning is the one transition that creates downstream records.
        if (stage === 'won') await convertWonOpportunity(tx, opportunityId, auth.user!.name)
        return { ok: true as const }
      })

      if ('missing' in result) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
      return NextResponse.json({ ok: true })
    } finally {
      await sql.end({ timeout: 5 }).catch(() => undefined)
    }
  } catch {
    return NextResponse.json({ error: 'Unable to update pipeline' }, { status: 500 })
  }
}
