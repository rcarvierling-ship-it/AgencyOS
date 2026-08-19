import { NextResponse } from 'next/server'
import { authenticate, sessionCookie, LoginThrottledError } from '../../../../lib/admin-auth'

export const runtime = 'nodejs'

/** Vercel puts the real client address at the head of x-forwarded-for. */
function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim().slice(0, 60) || null
  return request.headers.get('x-real-ip')?.trim().slice(0, 60) || null
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
    const email = String(body?.email || '').trim()
    const password = String(body?.password || '')
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })

    const result = await authenticate(email, password, clientIp(request))
    if (!result) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const response = NextResponse.json({ ok: true, user: result.user })
    response.cookies.set(sessionCookie(result.token))
    return response
  } catch (error) {
    if (error instanceof LoginThrottledError) {
      return NextResponse.json({ error: error.message }, {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfterSeconds) },
      })
    }
    console.error('AgencyOS login failed', error)
    return NextResponse.json({ error: 'Unable to sign in right now' }, { status: 500 })
  }
}
