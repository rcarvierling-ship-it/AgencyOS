import { NextResponse } from 'next/server'
import { clearCurrentSession } from '../../../../lib/admin-auth'

export const runtime = 'nodejs'

export async function POST() {
  await clearCurrentSession()
  const response = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  response.cookies.set('agencyos_session', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  response.cookies.set('agencyos_admin', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
