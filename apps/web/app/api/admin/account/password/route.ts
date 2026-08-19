import { NextResponse } from 'next/server'
import { changeOwnPassword, requireApiUser } from '../../../../../lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Any signed-in user may rotate their own password, including the owner.
  const auth = await requireApiUser()
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const body = await request.json().catch(() => null) as { currentPassword?: string; newPassword?: string } | null
    await changeOwnPassword(auth.user.id, String(body?.currentPassword ?? ''), String(body?.newPassword ?? ''))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to change password' }, { status: 400 })
  }
}
