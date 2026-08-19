import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../lib/admin-auth'
import { createBusiness } from '../../../../lib/crm'

export const runtime = 'nodejs'

const WRITERS = ['owner', 'admin', 'manager', 'operator', 'agent'] as const

export async function POST(request: Request) {
  const auth = await requireApiUser([...WRITERS])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const business = await createBusiness(await request.json(), auth.user.name)
    return NextResponse.json({ business }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create business' }, { status: 400 })
  }
}
