import { NextResponse } from 'next/server'
import { authenticateAgent, agentUnauthorized } from '../../../../../lib/agent-auth'
import { withWrite } from '../../../../../lib/crm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Claims the oldest queued build. Returns 204 when the queue is empty. */
export async function POST(request: Request) {
  const agent = authenticateAgent(request)
  if (!agent) return agentUnauthorized()

  try {
    const job = await withWrite(sql => sql.begin(async tx => {
      // A worker that dies mid-build would otherwise strand its job forever.
      await tx`
        update demo_builds set status='queued', claimed_by=null, claimed_at=null, updated_at=now()
        where status in ('claimed','building') and claimed_at < now() - interval '30 minutes'`

      // SKIP LOCKED so two workers can never claim the same job.
      const [row] = await tx<any[]>`
        select id from demo_builds where status='queued'
        order by created_at limit 1 for update skip locked`
      if (!row) return null

      const [claimed] = await tx<any[]>`
        update demo_builds set status='claimed', claimed_by=${agent.name}, claimed_at=now(), updated_at=now()
        where id=${row.id}
        returning id, brief, variation, business_id as "businessId"`
      const [business] = await tx<any[]>`select name, slug from businesses where id=${claimed.businessId}`
      const [demo] = await tx<any[]>`select slug from demos where id=(select demo_id from demo_builds where id=${claimed.id})`
      return { id: claimed.id, brief: claimed.brief, variation: claimed.variation, business: business?.name, demoSlug: demo?.slug }
    }))

    if (!job) return new NextResponse(null, { status: 204 })
    return NextResponse.json(job)
  } catch (error) {
    console.error('AgencyOS build claim failed', error)
    return NextResponse.json({ error: 'Unable to claim a build' }, { status: 500 })
  }
}
