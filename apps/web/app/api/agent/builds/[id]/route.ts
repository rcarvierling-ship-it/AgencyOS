import { NextResponse } from 'next/server'
import { authenticateAgent, agentUnauthorized } from '../../../../../lib/agent-auth'
import { withWrite } from '../../../../../lib/crm'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_HTML = 1_500_000

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = authenticateAgent(request)
  if (!agent) return agentUnauthorized()

  try {
    const { id } = await params
    const body = await request.json().catch(() => null) as { html?: string; error?: string; status?: string; requeue?: boolean } | null

    if (body?.error) {
      await withWrite(sql => sql.begin(async tx => {
        const [build] = await tx<any[]>`
          update demo_builds set status='failed', error=${String(body.error).slice(0, 2000)}, completed_at=now(), updated_at=now()
          where id=${id} returning business_id as "businessId", demo_id as "demoId"`
        if (!build) throw new Error('Build not found')
        // 'failed' not 'rejected': a broken build is not a human declining the
        // concept, and conflating them hides real failures behind a decision.
        if (build.demoId) await tx`update demos set status='failed', updated_at=now() where id=${build.demoId}`
        await tx`insert into business_activities (business_id,type,title,detail,metadata)
          values (${build.businessId},'note','Mockup build failed',${String(body.error).slice(0, 500)},${tx.json({ agent: agent.name })})`
      }))
      return NextResponse.json({ ok: true })
    }

    // A worker that could not start — rate limited, signed out — hands the job
    // back untouched. Marking it failed would lose work nobody attempted.
    if (body?.requeue) {
      await withWrite(sql => sql`
        update demo_builds set status='queued', claimed_by=null, claimed_at=null, updated_at=now()
        where id=${id} and status in ('claimed','building')`)
      return NextResponse.json({ ok: true, requeued: true })
    }

    if (body?.status === 'building') {
      await withWrite(sql => sql`update demo_builds set status='building', updated_at=now() where id=${id}`)
      return NextResponse.json({ ok: true })
    }

    const html = typeof body?.html === 'string' ? body.html : ''
    if (!html.trim()) return NextResponse.json({ error: 'No HTML was returned' }, { status: 400 })
    if (html.length > MAX_HTML) return NextResponse.json({ error: 'The mockup exceeds the size limit' }, { status: 413 })
    if (!/<html|<!doctype/i.test(html.slice(0, 400))) {
      return NextResponse.json({ error: 'That does not look like a complete HTML document' }, { status: 400 })
    }

    const result = await withWrite(sql => sql.begin(async tx => {
      const [build] = await tx<any[]>`
        update demo_builds set status='ready', output_html=${html}, completed_at=now(), error=null, updated_at=now()
        where id=${id} returning business_id as "businessId", demo_id as "demoId"`
      if (!build) throw new Error('Build not found')

      // The concept becomes reviewable, never automatically approved.
      if (build.demoId) await tx`update demos set status='ready', updated_at=now() where id=${build.demoId}`
      await tx`update businesses set status=case when status in ('discovered','qualified','researching') then 'demo_ready' else status end, updated_at=now() where id=${build.businessId}`
      await tx`insert into business_activities (business_id,type,title,detail,metadata)
        values (${build.businessId},'note','Mockup built',${`Claude Code returned a concept (${Math.round(html.length / 1024)} KB). Ready for review.`},${tx.json({ agent: agent.name })})`
      const [demo] = await tx<any[]>`select slug from demos where id=${build.demoId}`
      return { demoSlug: demo?.slug }
    }))

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('AgencyOS build submit failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to record the build' }, { status: 400 })
  }
}
