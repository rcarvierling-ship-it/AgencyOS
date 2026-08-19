import { NextResponse } from 'next/server'
import postgres from 'postgres'
import { requireApiUser } from '../../../../lib/admin-auth'
import { isPipelineStage } from '../../../../lib/pipeline'

export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  const auth = await requireApiUser(['owner','admin','manager','operator','agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const { opportunityId, stage } = await request.json()
    if (typeof opportunityId !== 'string' || !isPipelineStage(stage)) return NextResponse.json({ error: 'Invalid pipeline update' }, { status: 400 })
    const url = process.env.DATABASE_URL
    if (!url) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 })
    const sql = postgres(url, { prepare: false, max: 1 })
    try { await sql`update opportunities set stage=${stage}, updated_at=now() where id=${opportunityId}` }
    finally { await sql.end({ timeout: 2 }).catch(() => undefined) }
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Unable to update pipeline' }, { status: 500 }) }
}
