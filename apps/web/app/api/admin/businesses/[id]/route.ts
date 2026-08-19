import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../lib/admin-auth'
import { updateBusiness } from '../../../../../lib/crm'

export const runtime = 'nodejs'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const { id } = await params
    const business = await updateBusiness(id, await request.json(), auth.user.name)
    return NextResponse.json({ business })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update business' }, { status: 400 })
  }
}
