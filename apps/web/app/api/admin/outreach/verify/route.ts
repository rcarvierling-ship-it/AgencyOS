import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../lib/admin-auth'
import { verifyMailer, mailerStatus } from '../../../../../lib/mailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Proves the credentials work without mailing a real person. */
export async function POST() {
  const auth = await requireApiUser(['owner', 'admin'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  const status = mailerStatus()
  if (!status.ready) return NextResponse.json({ ok: false, error: `Missing: ${status.missing.join(', ')}` })
  const result = await verifyMailer()
  return NextResponse.json({ ...result, host: status.config.host, from: status.config.from })
}
