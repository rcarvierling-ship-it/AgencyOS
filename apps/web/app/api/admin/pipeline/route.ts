import { NextResponse } from 'next/server'
import postgres from 'postgres'

export async function PATCH(request: Request) {
  try {
    const { opportunityId, stage } = await request.json()
    const allowed = ['discovered','qualified','researching','demo_ready','contacted','interested','proposal','won','lost']
    if (typeof opportunityId !== 'string' || !allowed.includes(stage)) return NextResponse.json({ error: 'Invalid pipeline update' }, { status: 400 })
    const url = process.env.DATABASE_URL
    if (!url) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 })
    const sql = postgres(url, { prepare: false, max: 1 })
    try {
      await sql`update opportunities set stage=${stage}, updated_at=now() where id=${opportunityId}`
    } finally {
      await sql.end({ timeout: 2 }).catch(() => undefined)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unable to update pipeline' }, { status: 500 })
  }
}
