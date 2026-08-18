import { NextResponse } from 'next/server'
import { authenticate, sessionCookie } from '../../../../lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
    const email = String(body?.email || '').trim()
    const password = String(body?.password || '')
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })

    const result = await authenticate(email, password)
    if (!result) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const response = NextResponse.json({ ok: true, user: result.user })
    response.cookies.set(sessionCookie(result.token))
    return response
  } catch (error) {
    console.error('AgencyOS login failed', error)
    return NextResponse.json({ error: 'Unable to sign in right now' }, { status: 500 })
  }
}
