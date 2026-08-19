import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../../lib/admin-auth'
import { logActivity } from '../../../../../../lib/crm'

export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const { id } = await params
    const activity = await logActivity(id, await request.json(), auth.user.name)
    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to log activity' }, { status: 400 })
  }
}
