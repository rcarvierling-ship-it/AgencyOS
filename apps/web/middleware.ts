import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'agencyos_session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin/login' || pathname === '/api/admin/login' || pathname === '/api/admin/logout') return NextResponse.next()

  const token = request.cookies.get(COOKIE)?.value
  if (!token) return redirectToLogin(request)

  return NextResponse.next()
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/businesses/:path*'],
}
