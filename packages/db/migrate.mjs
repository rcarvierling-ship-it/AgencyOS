#!/usr/bin/env node
// Applies packages/db/migrations/*.sql in filename order, tracking what has run.
// Usage: DATABASE_URL=... node packages/db/migrate.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

// Load a .env file without adding a dependency. Real env always wins.
for (const file of ['.env.local', '.env']) {
  const path = join(root, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
}

// Migrations need a direct (non-pooled) connection: pgbouncer transaction mode
// cannot run DDL batches reliably.
const url = process.env.MIGRATE_DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL
if (!url) {
  console.error('No database URL. Set DATABASE_URL (or POSTGRES_URL_NON_POOLING).')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1 })
try {
  await sql`CREATE TABLE IF NOT EXISTS agency_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`

  const applied = new Set((await sql`SELECT name FROM agency_migrations`).map(r => r.name))
  const files = readdirSync(join(here, 'migrations')).filter(f => f.endsWith('.sql')).sort()
  let ran = 0

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`· ${file} (already applied)`)
      continue
    }
    process.stdout.write(`→ ${file} … `)
    await sql.unsafe(readFileSync(join(here, 'migrations', file), 'utf8'))
    await sql`INSERT INTO agency_migrations (name) VALUES (${file})`
    console.log('ok')
    ran++
  }

  console.log(ran ? `\nApplied ${ran} migration(s).` : '\nDatabase already up to date.')
} finally {
  await sql.end({ timeout: 5 }).catch(() => undefined)
}
