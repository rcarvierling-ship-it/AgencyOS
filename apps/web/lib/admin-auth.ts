import postgres from 'postgres'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AdminRole = 'owner' | 'admin' | 'manager' | 'operator' | 'agent' | 'viewer'
export type AdminUser = { id: string; email: string; name: string; role: AdminRole; active: boolean }

const COOKIE = 'agencyos_session'
const SESSION_DAYS = 7
const ROLES: AdminRole[] = ['owner', 'admin', 'manager', 'operator', 'agent', 'viewer']

function db() {
  const url = process.env.DATABASE_URL
  return url ? postgres(url, { prepare: false, max: 1 }) : null
}

function hex(bytes: ArrayBuffer | Uint8Array) {
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, key, 256)
  return `v1$${hex(salt)}$${hex(bits)}`
}

async function verifyPassword(password: string, encoded: string) {
  const [version, saltHex, expectedHex] = encoded.split('$')
  if (version !== 'v1' || !saltHex || !expectedHex) return false
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? [])
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, key, 256)
  const actual = hex(bits)
  if (actual.length !== expectedHex.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expectedHex.charCodeAt(i)
  return diff === 0
}

export async function ensureAuthTables() {
  const sql = db()
  if (!sql) throw new Error('DATABASE_URL is not configured')
  try {
    await sql`CREATE TABLE IF NOT EXISTS agency_users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, name text NOT NULL, password_hash text NOT NULL, role text NOT NULL DEFAULT 'agent' CHECK (role IN ('owner','admin','manager','operator','agent','viewer')), active boolean NOT NULL DEFAULT true, last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`
    await sql`CREATE TABLE IF NOT EXISTS agency_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES agency_users(id) ON DELETE CASCADE, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`
    await sql`CREATE INDEX IF NOT EXISTS agency_sessions_user_id_idx ON agency_sessions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS agency_sessions_expires_at_idx ON agency_sessions(expires_at)`
    const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int as count FROM agency_users`
    if (Number(count) === 0 && process.env.ADMIN_PASSWORD) {
      const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD)
      const email = (process.env.ADMIN_EMAIL || 'owner@rcvagency.com').trim().toLowerCase()
      await sql`INSERT INTO agency_users (email,name,password_hash,role) VALUES (${email},'RCV Agency Owner',${passwordHash},'owner') ON CONFLICT (email) DO NOTHING`
    }
  } finally { await sql.end({ timeout: 2 }).catch(() => undefined) }
}

export async function authenticate(email: string, password: string) {
  await ensureAuthTables()
  const sql = db(); if (!sql) throw new Error('DATABASE_URL is not configured')
  try {
    const [user] = await sql<any[]>`SELECT id,email,name,role,active,password_hash FROM agency_users WHERE lower(email)=lower(${email.trim()}) LIMIT 1`
    if (!user || !user.active || !(await verifyPassword(password, user.password_hash))) return null
    await sql`UPDATE agency_users SET last_login_at=now(),updated_at=now() WHERE id=${user.id}`
    const token = hex(crypto.getRandomValues(new Uint8Array(32)))
    const tokenHash = await sha256(token)
    await sql`DELETE FROM agency_sessions WHERE expires_at < now()`
    await sql`INSERT INTO agency_sessions (user_id,token_hash,expires_at) VALUES (${user.id},${tokenHash},now()+interval '7 days')`
    return { token, user: { id:user.id,email:user.email,name:user.name,role:user.role as AdminRole,active:true } as AdminUser }
  } finally { await sql.end({ timeout: 2 }).catch(() => undefined) }
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const sql = db(); if (!sql) return null
  try {
    const [user] = await sql<any[]>`SELECT u.id,u.email,u.name,u.role,u.active FROM agency_sessions s JOIN agency_users u ON u.id=s.user_id WHERE s.token_hash=${await sha256(token)} AND s.expires_at>now() AND u.active=true LIMIT 1`
    return user ? { id:user.id,email:user.email,name:user.name,role:user.role as AdminRole,active:true } : null
  } catch { return null }
  finally { await sql.end({ timeout: 2 }).catch(() => undefined) }
}

export async function requireUser(allowed?: AdminRole[]) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  if (allowed && !allowed.includes(user.role)) redirect('/admin')
  return user
}

export async function requireApiUser(allowed?: AdminRole[]) {
  const user = await getCurrentUser()
  if (!user) return { user:null, error:'Authentication required' as const }
  if (allowed && !allowed.includes(user.role)) return { user:null, error:'Insufficient permissions' as const }
  return { user, error:null }
}

export async function createUser(input: { email:string; name:string; password:string; role:AdminRole }) {
  if (!ROLES.includes(input.role)) throw new Error('Invalid role')
  if (input.password.length<12) throw new Error('Password must be at least 12 characters')
  if (!input.email.includes('@') || !input.name.trim()) throw new Error('Name and a valid email are required')
  await ensureAuthTables(); const sql=db(); if (!sql) throw new Error('DATABASE_URL is not configured')
  try { const [user]=await sql<any[]>`INSERT INTO agency_users (email,name,password_hash,role) VALUES (${input.email.trim().toLowerCase()},${input.name.trim()},${await hashPassword(input.password)},${input.role}) RETURNING id,email,name,role,active,created_at as "createdAt",last_login_at as "lastLoginAt"`; return user }
  finally { await sql.end({timeout:2}).catch(()=>undefined) }
}

export async function listUsers() {
  await ensureAuthTables(); const sql=db(); if(!sql) return []
  try { return await sql<any[]>`SELECT id,email,name,role,active,created_at as "createdAt",last_login_at as "lastLoginAt" FROM agency_users ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,name` }
  finally { await sql.end({timeout:2}).catch(()=>undefined) }
}

export async function updateUser(id:string,input:{name?:string;role?:AdminRole;active?:boolean;password?:string}) {
  if(input.role&&!ROLES.includes(input.role)) throw new Error('Invalid role')
  if(input.password!==undefined&&input.password.length<12) throw new Error('Password must be at least 12 characters')
  await ensureAuthTables(); const sql=db(); if(!sql) throw new Error('DATABASE_URL is not configured')
  try { const [user]=await sql<any[]>`UPDATE agency_users SET name=COALESCE(${input.name?.trim()||null},name),role=COALESCE(${input.role||null},role),active=COALESCE(${input.active??null},active),password_hash=COALESCE(${input.password?await hashPassword(input.password):null},password_hash),updated_at=now() WHERE id=${id} RETURNING id,email,name,role,active,created_at as "createdAt",last_login_at as "lastLoginAt"`; if(!user)throw new Error('User not found'); return user }
  finally { await sql.end({timeout:2}).catch(()=>undefined) }
}

export async function deleteUser(id:string) {
  await ensureAuthTables(); const sql=db(); if(!sql) throw new Error('DATABASE_URL is not configured')
  try { const [target]=await sql<any[]>`SELECT role FROM agency_users WHERE id=${id}`; if(!target)return false; if(target.role==='owner'){const [{owners}]=await sql<{owners:number}[]>`SELECT count(*)::int as owners FROM agency_users WHERE role='owner' AND active=true`;if(Number(owners)<=1)throw new Error('The last active owner cannot be deleted')}; await sql`DELETE FROM agency_users WHERE id=${id}`; return true }
  finally { await sql.end({timeout:2}).catch(()=>undefined) }
}

export function sessionCookie(token:string){return {name:COOKIE,value:token,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*24*SESSION_DAYS}}

export async function clearCurrentSession(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return;const sql=db();if(!sql)return;try{await sql`DELETE FROM agency_sessions WHERE token_hash=${await sha256(token)}`}finally{await sql.end({timeout:2}).catch(()=>undefined)}}

export const adminRoles=ROLES
