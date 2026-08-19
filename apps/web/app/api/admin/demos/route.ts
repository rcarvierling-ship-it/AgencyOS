import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../lib/admin-auth'
import { withWrite } from '../../../../lib/crm'

export const runtime = 'nodejs'

const STATUSES = ['generating', 'ready', 'approved', 'rejected'] as const

/** Approval is the gate between an internal concept and anything going out. */
export async function PATCH(request: Request) {
  const auth = await requireApiUser(['owner', 'admin', 'manager'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const { demoId, status } = await request.json()
    if (typeof demoId !== 'string' || !(STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Invalid demo update' }, { status: 400 })
    }
    await withWrite(sql => sql.begin(async tx => {
      const [demo] = await tx<any[]>`select id, business_id as "businessId", slug from demos where id=${demoId}`
      if (!demo) throw new Error('Demo not found')
      await tx`update demos set status=${status}, approved_at=${status === 'approved' ? new Date() : null}, updated_at=now() where id=${demoId}`
      await tx`
        insert into business_activities (business_id,type,title,detail,metadata)
        values (${demo.businessId},'note',${status === 'approved' ? 'Demo approved' : 'Demo status changed'},
                ${`Concept /demo/${demo.slug} marked ${status} by ${auth.user!.name}.`},
                ${tx.json({ actor: auth.user!.name, status })})`
    }))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update the demo' }, { status: 400 })
  }
}
