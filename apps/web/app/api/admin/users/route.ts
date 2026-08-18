import { NextResponse } from 'next/server'
import { createUser, deleteUser, listUsers, requireApiUser, updateUser, type AdminRole } from '../../../../lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireApiUser(['owner'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try { return NextResponse.json({ users: await listUsers() }) }
  catch { return NextResponse.json({ error: 'Unable to load team' }, { status: 500 }) }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(['owner'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const body = await request.json()
    const role = String(body.role || 'agent') as AdminRole
    const user = await createUser({ email: String(body.email || ''), name: String(body.name || ''), password: String(body.password || ''), role })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create user'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser(['owner'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'User id is required' }, { status: 400 })
    if (id === auth.user.id && body.role && body.role !== 'owner') return NextResponse.json({ error: 'You cannot remove your own owner role' }, { status: 400 })
    if (id === auth.user.id && body.active === false) return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 })
    const user = await updateUser(id, { name: body.name, role: body.role, active: typeof body.active === 'boolean' ? body.active : undefined, password: body.password || undefined })
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update user'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser(['owner'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id || id === auth.user.id) return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    await deleteUser(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete user'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
