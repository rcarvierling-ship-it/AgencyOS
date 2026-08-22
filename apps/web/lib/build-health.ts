// Checks a delivered mockup before anyone can act on it.
//
// A concept with dead images renders as a broken page for the prospect while
// looking perfectly finished in the review queue. That gap is the problem.

export type BuildHealth = {
  images: { total: number; ok: number; broken: string[] }
  bytes: number
  checkedAt: string
  warnings: string[]
}

const MAX_CHECKED = 14
const PER_IMAGE_MS = 6000

/**
 * `&amp;` inside a src attribute is correct HTML — the browser decodes it back
 * to `&`. Checking the raw attribute instead of the decoded URL reported
 * working images as broken, which is worse than not checking at all: it makes
 * the inspector something you learn to ignore.
 */
function decodeEntities(url: string) {
  return url
    .replace(/&amp;/gi, '&').replace(/&#0?38;/g, '&')
    .replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
}

async function loads(url: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PER_IMAGE_MS)
  try {
    const response = await fetch(url, { method: 'GET', headers: { range: 'bytes=0-0' }, signal: controller.signal, cache: 'no-store' })
    return response.ok || response.status === 206
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function inspectBuild(html: string): Promise<BuildHealth> {
  const warnings: string[] = []
  const srcs = [...new Set([...html.matchAll(/<img[^>]+src=["'](https?:[^"']+)["']/gi)].map(m => decodeEntities(m[1]!)))]
  const checked = srcs.slice(0, MAX_CHECKED)
  const results = await Promise.all(checked.map(async url => ({ url, ok: await loads(url) })))
  const broken = results.filter(r => !r.ok).map(r => r.url)
  const ok = results.length - broken.length

  if (broken.length) {
    warnings.push(`${broken.length} of ${checked.length} images do not load. The concept will show empty blocks where they should be.`)
  }
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) warnings.push('No viewport meta tag — this will not render correctly on a phone.')
  if (!/@media/i.test(html)) warnings.push('No media queries found, so the page is unlikely to be responsive.')
  if (!/href=["']tel:/i.test(html)) warnings.push('No tap-to-call link.')
  if (html.length < 8000) warnings.push('The page is very short for a concept.')

  return { images: { total: srcs.length, ok, broken: broken.slice(0, 6) }, bytes: html.length, checkedAt: new Date().toISOString(), warnings }
}
