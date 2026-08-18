import { NextResponse } from 'next/server';

const COOKIE = 'agencyos_admin';

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return `${value}.${Buffer.from(signature).toString('base64url')}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { password?: string } | null;
  const password = body?.password ?? '';
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_AUTH_SECRET;

  if (!expected || !secret || password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await sign('authenticated', secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
