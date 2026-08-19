import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type Check = { category: Category; label: string; status: CheckStatus; detail: string; weight: number }
export type Category = 'mobile' | 'performance' | 'seo' | 'accessibility' | 'conversion' | 'design'

export type AuditResult = {
  url: string | null
  reachable: boolean
  error: string | null
  statusCode: number | null
  responseMs: number | null
  scores: Record<Category, number | null> & { overall: number | null }
  opportunityScore: number
  checks: Check[]
}

const CATEGORIES: Category[] = ['mobile', 'performance', 'seo', 'accessibility', 'conversion', 'design']
const MAX_BYTES = 2_000_000
const MAX_REDIRECTS = 3
const TIMEOUT_MS = 12_000

// SSRF guard -----------------------------------------------------------------
// Website URLs are operator-supplied, so every hop must be proven to live on a
// public address before we ask the server to fetch it.

function isPrivateAddress(ip: string) {
  if (ip.includes(':')) {
    const v6 = ip.toLowerCase()
    if (v6 === '::1' || v6 === '::') return true
    if (/^f[cd]/.test(v6)) return true                 // unique local fc00::/7
    if (/^fe[89ab]/.test(v6)) return true              // link local fe80::/10
    if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7))
    return false
  }
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = p as [number, number, number, number]
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true              // link local
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true    // carrier grade NAT
  if (a >= 224) return true                            // multicast and reserved
  return false
}

async function assertPublicUrl(raw: string) {
  let url: URL
  try { url = new URL(raw) } catch { throw new Error('That is not a valid URL') }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http and https URLs can be audited')
  if (url.port && !['80', '443', ''].includes(url.port)) throw new Error('Only standard web ports can be audited')

  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error('That address is not publicly reachable')
    return url
  }
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('That address is not publicly reachable')
  }
  const resolved = await lookup(host, { all: true }).catch(() => { throw new Error('That domain could not be resolved') })
  if (!resolved.length || resolved.some(entry => isPrivateAddress(entry.address))) {
    throw new Error('That address is not publicly reachable')
  }
  return url
}

/** Follows redirects by hand so every hop is re-validated against the guard. */
async function fetchPage(startUrl: string) {
  let current = await assertPublicUrl(startUrl)
  let redirects = 0
  let httpUpgraded = false

  while (true) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const began = Date.now()
    try {
      const response = await fetch(current, {
        redirect: 'manual', signal: controller.signal, cache: 'no-store',
        headers: { 'user-agent': 'AgencyOS-Auditor/1.0 (+https://rcvagency.com)', accept: 'text/html,*/*' },
      })
      const elapsed = Date.now() - began

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location || redirects >= MAX_REDIRECTS) throw new Error('Too many redirects')
        const next = await assertPublicUrl(new URL(location, current).toString())
        if (current.protocol === 'http:' && next.protocol === 'https:') httpUpgraded = true
        current = next
        redirects++
        continue
      }

      const buffer = await response.arrayBuffer()
      const html = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, MAX_BYTES))
      return { html, status: response.status, elapsed, finalUrl: current, bytes: buffer.byteLength, httpUpgraded }
    } finally {
      clearTimeout(timer)
    }
  }
}

// Analysis -------------------------------------------------------------------

const has = (html: string, re: RegExp) => re.test(html)
const head = (html: string) => html.slice(0, Math.max(0, html.search(/<\/head>/i)) || 20_000)

function analyze(html: string, ctx: { status: number; elapsed: number; finalUrl: URL; bytes: number; httpUpgraded: boolean }) {
  const checks: Check[] = []
  const add = (category: Category, label: string, status: CheckStatus, detail: string, weight = 1) =>
    checks.push({ category, label, status, detail, weight })

  const h = head(html)
  const viewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.exec(h)?.[0] ?? ''
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(h)?.[1]?.trim() ?? ''
  const description = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(h)?.[1]?.trim() ?? ''
  const h1s = html.match(/<h1[\b>]/gi)?.length ?? 0
  const images = html.match(/<img\b[^>]*>/gi) ?? []
  const withAlt = images.filter(tag => /\balt\s*=/i.test(tag)).length

  // Mobile
  add('mobile', 'Mobile viewport', viewport ? 'pass' : 'fail',
    viewport ? 'A viewport meta tag is present, so the page can adapt to phones.' : 'No viewport meta tag — the page will render at desktop width on a phone and require pinch-zooming.', 3)
  const blocksZoom = /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(viewport)
  add('mobile', 'Pinch-zoom allowed', blocksZoom ? 'fail' : 'pass',
    blocksZoom ? 'The viewport disables zooming, which fails accessibility guidance.' : 'Visitors can zoom the page.', 1)
  add('mobile', 'Responsive styling signals', has(html, /@media|max-w|col-|grid-|flex/i) ? 'pass' : 'warn',
    has(html, /@media|max-w|col-|grid-|flex/i) ? 'Responsive layout techniques were detected.' : 'No responsive layout signals found in the markup.', 1)

  // Performance
  const fast = ctx.elapsed < 800, ok = ctx.elapsed < 2000
  add('performance', 'Server response time', fast ? 'pass' : ok ? 'warn' : 'fail',
    `The page responded in ${ctx.elapsed} ms.`, 3)
  const weightMb = ctx.bytes / 1_000_000
  add('performance', 'HTML weight', ctx.bytes < 150_000 ? 'pass' : ctx.bytes < 500_000 ? 'warn' : 'fail',
    `The HTML document is ${weightMb < 0.1 ? Math.round(ctx.bytes / 1000) + ' KB' : weightMb.toFixed(1) + ' MB'}.`, 1)
  const blockingScripts = (h.match(/<script\b(?![^>]*\b(async|defer|type=["']application\/ld\+json["']))[^>]*\bsrc=/gi) ?? []).length
  add('performance', 'Render-blocking scripts', blockingScripts === 0 ? 'pass' : blockingScripts <= 2 ? 'warn' : 'fail',
    blockingScripts === 0 ? 'No render-blocking scripts in the head.' : `${blockingScripts} script${blockingScripts === 1 ? '' : 's'} in the head block first paint.`, 2)

  // SEO
  add('seo', 'Page title', title ? (title.length >= 15 && title.length <= 65 ? 'pass' : 'warn') : 'fail',
    title ? `Title is ${title.length} characters: “${title.slice(0, 70)}”.` : 'The page has no title element.', 3)
  add('seo', 'Meta description', description ? (description.length >= 50 ? 'pass' : 'warn') : 'fail',
    description ? `Description is ${description.length} characters.` : 'No meta description, so search engines invent the snippet.', 2)
  add('seo', 'Single H1', h1s === 1 ? 'pass' : h1s === 0 ? 'fail' : 'warn',
    h1s === 1 ? 'Exactly one H1 heading.' : h1s === 0 ? 'No H1 heading — the page states no clear subject.' : `${h1s} H1 headings compete for the page topic.`, 2)
  add('seo', 'HTTPS', ctx.finalUrl.protocol === 'https:' ? 'pass' : 'fail',
    ctx.finalUrl.protocol === 'https:' ? 'Served over HTTPS.' : 'Served over plain HTTP — browsers mark this “Not secure”.', 3)
  add('seo', 'Structured data', has(h, /application\/ld\+json/i) ? 'pass' : 'warn',
    has(h, /application\/ld\+json/i) ? 'JSON-LD structured data present.' : 'No structured data, so local business details are not machine-readable.', 1)

  // Accessibility
  add('accessibility', 'Language declared', has(html, /<html[^>]+lang=/i) ? 'pass' : 'fail',
    has(html, /<html[^>]+lang=/i) ? 'The document declares a language.' : 'No lang attribute on the html element.', 1)
  const altCoverage = images.length ? withAlt / images.length : 1
  add('accessibility', 'Image alt text', images.length === 0 ? 'warn' : altCoverage >= 0.9 ? 'pass' : altCoverage >= 0.5 ? 'warn' : 'fail',
    images.length === 0 ? 'No images found in the markup.' : `${withAlt} of ${images.length} images have alt text.`, 2)

  // Conversion
  const tel = has(html, /href=["']tel:/i)
  const mail = has(html, /href=["']mailto:/i)
  const form = has(html, /<form\b/i)
  add('conversion', 'Tap-to-call', tel ? 'pass' : 'fail',
    tel ? 'A tap-to-call link is present.' : 'No tel: link — phone numbers are not tappable on mobile.', 3)
  add('conversion', 'Contact route', form || mail ? 'pass' : 'fail',
    form ? 'A contact form is present.' : mail ? 'An email link is present.' : 'No form or email link — there is no way to make contact from the page.', 3)
  const cta = /(\bget a quote\b|\bfree estimate\b|\bbook\b|\bschedule\b|\brequest\b|\bcontact us\b|\bcall now\b|\bget started\b)/i.test(html)
  add('conversion', 'Clear call to action', cta ? 'pass' : 'warn',
    cta ? 'Recognisable call-to-action wording found.' : 'No obvious call-to-action wording.', 2)

  // Design signals — structural proxies, not an aesthetic judgement.
  add('design', 'Modern document type', /^\s*<!doctype html>/i.test(html.slice(0, 200)) ? 'pass' : 'fail',
    /^\s*<!doctype html>/i.test(html.slice(0, 200)) ? 'Uses the HTML5 doctype.' : 'Missing or legacy doctype, which usually indicates a very old build.', 1)
  const tableLayout = (html.match(/<table\b/gi) ?? []).length >= 3 && !has(html, /@media/i)
  add('design', 'Layout technique', tableLayout ? 'fail' : 'pass',
    tableLayout ? 'Layout appears to be table-based, a pre-2010 technique.' : 'No table-based layout detected.', 2)
  // Scans the whole document: fonts are usually declared in linked CSS, so a
  // head-only check reports false negatives on perfectly typeset sites.
  const fonts = has(html, /fonts\.(googleapis|gstatic)|@font-face|font-family/i)
  add('design', 'Web fonts', fonts ? 'pass' : 'warn',
    fonts ? 'Custom typography is in use.' : 'No custom typography found in the markup.', 1)
  add('design', 'Social preview image', has(h, /property=["']og:image["']/i) ? 'pass' : 'warn',
    has(h, /property=["']og:image["']/i) ? 'An Open Graph image is set.' : 'No Open Graph image, so shared links render without a preview.', 1)
  add('design', 'Favicon', has(h, /rel=["'][^"']*icon/i) ? 'pass' : 'warn',
    has(h, /rel=["'][^"']*icon/i) ? 'A favicon is declared.' : 'No favicon declared.', 1)

  return checks
}

function score(checks: Check[], category: Category): number | null {
  const relevant = checks.filter(c => c.category === category)
  if (!relevant.length) return null
  const earned = relevant.reduce((sum, c) => sum + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0)
  const possible = relevant.reduce((sum, c) => sum + c.weight, 0)
  return Math.round((earned / possible) * 100)
}

/**
 * Audits a business website. A business with no site is not an error — it is
 * the strongest opportunity there is, and is recorded as such.
 */
export async function auditWebsite(rawUrl: string | null): Promise<AuditResult> {
  const empty = { mobile: null, performance: null, seo: null, accessibility: null, conversion: null, design: null, overall: null }

  if (!rawUrl || !rawUrl.trim()) {
    return {
      url: null, reachable: false, error: null, statusCode: null, responseMs: null,
      scores: empty, opportunityScore: 95,
      checks: [{ category: 'conversion', label: 'Website', status: 'fail', weight: 3, detail: 'No website is recorded for this business — the strongest possible opportunity.' }],
    }
  }

  const trimmed = rawUrl.trim()
  const target = trimmed.includes('://') ? trimmed : `https://${trimmed}`
  try {
    const page = await fetchPage(target)
    if (page.status >= 400) {
      return {
        url: page.finalUrl.toString(), reachable: false, error: `The site returned HTTP ${page.status}`,
        statusCode: page.status, responseMs: page.elapsed, scores: empty, opportunityScore: 90,
        checks: [{ category: 'performance', label: 'Reachability', status: 'fail', weight: 3, detail: `The site responded with HTTP ${page.status}.` }],
      }
    }

    const checks = analyze(page.html, page)
    const scores = {
      mobile: score(checks, 'mobile'), performance: score(checks, 'performance'), seo: score(checks, 'seo'),
      accessibility: score(checks, 'accessibility'), conversion: score(checks, 'conversion'), design: score(checks, 'design'),
    }
    const earned = checks.reduce((sum, c) => sum + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0)
    const possible = checks.reduce((sum, c) => sum + c.weight, 0)
    const overall = Math.round((earned / possible) * 100)

    // A weak site is a strong opportunity, but never a certainty.
    const opportunityScore = Math.max(5, Math.min(95, Math.round(100 - overall * 0.85)))
    return {
      url: page.finalUrl.toString(), reachable: true, error: null, statusCode: page.status,
      responseMs: page.elapsed, scores: { ...scores, overall }, opportunityScore, checks,
    }
  } catch (error) {
    const message = error instanceof Error
      ? (error.name === 'AbortError' || error.name === 'TimeoutError' ? 'The site did not respond within 12 seconds' : error.message)
      : 'The site could not be reached'
    return {
      url: target, reachable: false, error: message, statusCode: null, responseMs: null,
      scores: empty, opportunityScore: 85,
      checks: [{ category: 'performance', label: 'Reachability', status: 'fail', weight: 3, detail: message + '.' }],
    }
  }
}

export const AUDIT_CATEGORIES = CATEGORIES
