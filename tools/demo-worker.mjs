#!/usr/bin/env node
// Builds queued mockups by handing each brief to Claude Code.
//
// AgencyOS runs on Vercel and cannot invoke a local CLI, so it queues the work
// and this claims it. Run it wherever Claude Code is installed and signed in:
//
//   AGENT_API_TOKEN=... node tools/demo-worker.mjs
//
// Options:
//   --url <base>       AgencyOS base URL (default https://www.rcvagency.com)
//   --once             Build a single job and exit
//   --watch            Poll forever, building whatever appears (used by launchd)
//   --interval <secs>  Poll interval in watch mode (default 15)
//   --keep             Leave the working directory in place for inspection
//   --model <name>     Model passed to Claude Code

import { spawn } from 'node:child_process'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback }
const flag = name => args.includes(name)

const BASE = (opt('--url', process.env.AGENCYOS_URL || 'https://www.rcvagency.com')).replace(/\/$/, '')
const TOKEN = process.env.AGENT_API_TOKEN
const MODEL = opt('--model', process.env.AGENCYOS_BUILD_MODEL || '')
const AGENT_NAME = process.env.AGENT_NAME || 'demo-worker'

if (!TOKEN) {
  console.error('AGENT_API_TOKEN is not set. Generate one, add it to Vercel, and export it here.')
  process.exit(1)
}

const headers = { authorization: `Bearer ${TOKEN}`, 'x-agent-name': AGENT_NAME, 'content-type': 'application/json' }
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

async function claim() {
  const response = await fetch(`${BASE}/api/agent/builds/next`, { method: 'POST', headers })
  if (response.status === 204) return null
  if (response.status === 401) throw new Error('Agent token rejected. Check AGENT_API_TOKEN matches Vercel.')
  if (!response.ok) throw new Error(`Claim failed (${response.status}): ${await response.text()}`)
  return response.json()
}

async function report(id, payload) {
  const response = await fetch(`${BASE}/api/agent/builds/${id}`, { method: 'POST', headers, body: JSON.stringify(payload) })
  if (!response.ok) log(`  ! report failed (${response.status}): ${await response.text()}`)
  return response.ok
}

/** Runs Claude Code headlessly in `cwd`, streaming its output to the console. */
function runClaude(cwd, promptFile) {
  return new Promise((resolve, reject) => {
    const argv = ['-p', `Read BRIEF.md in this directory and carry it out in full.`,
      '--permission-mode', 'acceptEdits',
      '--add-dir', cwd]
    if (MODEL) argv.push('--model', MODEL)

    const child = spawn('claude', argv, { cwd, stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
    let tail = ''
    const capture = chunk => { tail = (tail + chunk).slice(-4000); process.stdout.write(chunk) }
    child.stdout.on('data', capture)
    child.stderr.on('data', capture)
    child.on('error', reject)
    // The artifact matters more than the exit code: a run that wrote a complete
    // page and then hit a usage limit has still done the work.
    child.on('close', code => resolve({ tail, code }))
  })
}

async function buildOne(job) {
  log(`claimed ${job.id} — ${job.business} (${job.variation?.archetypeName ?? 'no archetype'})`)
  const dir = await mkdtemp(join(tmpdir(), 'agencyos-mockup-'))
  try {
    await writeFile(join(dir, 'BRIEF.md'), job.brief, 'utf8')
    await report(job.id, { status: 'building' })
    log(`  building in ${dir}`)

    const { tail, code } = await runClaude(dir)

    const out = join(dir, 'mockup.html')
    if (!existsSync(out)) {
      throw new Error(code === 0
        ? 'Claude Code finished without writing mockup.html'
        : `claude exited ${code} and wrote nothing: ${tail.slice(-400).trim()}`)
    }
    const html = await readFile(out, 'utf8')
    if (html.length < 500) throw new Error(`mockup.html is only ${html.length} bytes`)
    if (code !== 0) log(`  ! claude exited ${code} but produced a page — delivering it anyway`)

    const ok = await report(job.id, { html })
    log(ok ? `  ✓ delivered ${(html.length / 1024).toFixed(0)} KB → ${BASE}/demo/${job.demoSlug}` : '  ! delivery failed')
  } catch (error) {
    log(`  ✗ ${error.message}`)
    await report(job.id, { error: error.message })
  } finally {
    if (flag('--keep')) log(`  working dir kept: ${dir}`)
    else await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function drain() {
  let built = 0
  for (;;) {
    const job = await claim()
    if (!job) return built
    await buildOne(job)
    built++
    if (flag('--once')) return built
  }
}

if (flag('--watch')) {
  const interval = Math.max(5, Number(opt('--interval', 15))) * 1000
  log(`watching ${BASE} every ${interval / 1000}s — press Ctrl+C to stop`)
  let quiet = false
  for (;;) {
    try {
      const built = await drain()
      if (built) { log(`built ${built}; watching again`); quiet = false }
      else if (!quiet) { log('queue empty; watching'); quiet = true }
    } catch (error) {
      // A network blip or a redeploy must not kill the watcher.
      log(`! ${error.message}`)
      quiet = false
    }
    await sleep(interval)
  }
}

const built = await drain()
log(built ? `built ${built}` : 'nothing queued')
