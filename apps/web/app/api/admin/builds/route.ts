import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../lib/admin-auth'
import { withWrite } from '../../../../lib/crm'

export const runtime = 'nodejs'

/** Returns a failed or stuck build to the queue so a worker can retry it. */
export async function PATCH(request: Request) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const { buildId, action } = await request.json()
    if (typeof buildId !== 'string' || action !== 'requeue') {
      return NextResponse.json({ error: 'Invalid build update' }, { status: 400 })
    }
    await withWrite(sql => sql.begin(async tx => {
      const [build] = await tx<any[]>`
        update demo_builds set status='queued', error=null, claimed_by=null, claimed_at=null, completed_at=null, updated_at=now()
        where id=${buildId} and status in ('failed','claimed','building')
        returning business_id as "businessId", demo_id as "demoId"`
      if (!build) throw new Error('That build cannot be requeued')
      if (build.demoId) await tx`update demos set status='generating', updated_at=now() where id=${build.demoId}`
      await tx`insert into business_activities (business_id,type,title,detail,metadata)
        values (${build.businessId},'note','Mockup build requeued',${`Returned to the queue by ${auth.user!.name}.`},${tx.json({ actor: auth.user!.name })})`
    }))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to requeue' }, { status: 400 })
  }
}
