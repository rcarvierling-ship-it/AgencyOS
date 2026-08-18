import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'agencyos_admin';

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return `${value}.${Buffer.from(signature).toString('base64url')}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  const secret = process.env.ADMIN_AUTH_SECRET;
  const token = request.cookies.get(COOKIE)?.value;
  if (!secret || !token) return redirectToLogin(request);

  const expected = await sign('authenticated', secret);
  if (token !== expected) return redirectToLogin(request);

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/api/businesses/:path*'],
};
