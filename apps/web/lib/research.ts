// Pulls the raw material for a mockup out of a business's existing website.
//
// This is the legitimate source: their own published pages. Nothing is
// invented — if the site has no testimonials, none are recorded, and the brief
// downstream says so rather than filling the gap with plausible fiction.

import { fetchPage } from './audit'

export type BusinessResearch = {
  sourceUrl: string | null
  title: string | null
  description: string | null
  headings: string[]
  services: string[]
  about: string | null
  testimonials: { quote: string; attribution: string | null }[]
  images: string[]
  socials: string[]
  emails: string[]
  phones: string[]
  brandColors: string[]
  fetchedAt: string
  notes: string[]
}

const decode = (s: string) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))

const strip = (html: string) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

function absolute(src: string, base: URL) {
  try { return new URL(src, base).toString() } catch { return null }
}

/** Filters out spacers, tracking pixels, icons and sprites. */
function looksLikeContentImage(url: string) {
  const u = url.toLowerCase()
  if (/\.(svg|gif)(\?|$)/.test(u)) return false
  if (/(sprite|icon|logo-?small|pixel|spacer|blank|1x1|favicon|badge|avatar-default)/.test(u)) return false
  return /\.(jpe?g|png|webp|avif)(\?|$)/.test(u) || /\/(image|photo|upload|media|wp-content)/.test(u)
}

export async function researchWebsite(rawUrl: string): Promise<BusinessResearch> {
  const notes: string[] = []
  const target = rawUrl.includes('://') ? rawUrl : `https://${rawUrl}`
  const page = await fetchPage(target)
  const html = page.html
  const base = page.finalUrl

  const head = html.slice(0, Math.max(0, html.search(/<\/head>/i)) || 20000)
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1]
  const description = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(head)?.[1]

  const headings = [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(m => strip(m[2] ?? '')).filter(h => h.length > 2 && h.length < 120)
  const uniqueHeadings = [...new Set(headings)].slice(0, 25)

  // Service names tend to live in nav items and repeated card headings.
  const navText = [...html.matchAll(/<nav[\s\S]*?<\/nav>/gi)].map(m => m[0]).join(' ')
  const navItems = [...navText.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => strip(m[1] ?? ''))
    .filter(t => t.length > 2 && t.length < 40 && !/home|contact|about|blog|privacy|terms|login|cart/i.test(t))
  const services = [...new Set([...navItems, ...uniqueHeadings.filter(h => h.split(' ').length <= 5)])].slice(0, 12)

  // Paragraphs that read like an "about" statement.
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => strip(m[1] ?? '')).filter(p => p.length > 80)
  const about = paragraphs.sort((a, b) => b.length - a.length)[0]?.slice(0, 700) ?? null

  // Quoted text inside blockquote/testimonial markup only — never inferred.
  const testimonials: { quote: string; attribution: string | null }[] = []
  for (const m of html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi)) {
    const quote = strip(m[1] ?? '')
    if (quote.length > 25 && quote.length < 600) testimonials.push({ quote, attribution: null })
  }
  for (const m of html.matchAll(/<[^>]+class=["'][^"']*(testimonial|review)[^"']*["'][^>]*>([\s\S]*?)<\/[a-z]+>/gi)) {
    const quote = strip(m[2] ?? '')
    if (quote.length > 25 && quote.length < 600 && !testimonials.some(t => t.quote === quote)) {
      testimonials.push({ quote, attribution: null })
    }
  }

  const images = [...new Set([...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map(m => absolute(m[1]!, base))
    .filter((u): u is string => Boolean(u) && looksLikeContentImage(u!)))].slice(0, 20)

  const ogImage = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(head)?.[1]
  if (ogImage) { const abs = absolute(ogImage, base); if (abs && !images.includes(abs)) images.unshift(abs) }

  const socials = [...new Set([...html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:facebook|instagram|linkedin|x|twitter|youtube|tiktok)\.com\/[^"']+)["']/gi)].map(m => m[1]!))].slice(0, 8)
  const emails = [...new Set([...html.matchAll(/mailto:([^"'?\s>]+)/gi)].map(m => decode(m[1]!)))].slice(0, 5)
  const phones = [...new Set([...html.matchAll(/tel:([^"'?\s>]+)/gi)].map(m => decode(m[1]!)))].slice(0, 5)
  const brandColors = [...new Set([...html.matchAll(/#([0-9a-f]{6})\b/gi)].map(m => '#' + m[1]!.toLowerCase()))]
    .filter(c => !/^#(fff|000)/.test(c) && c !== '#ffffff' && c !== '#000000').slice(0, 8)

  if (!images.length) notes.push('No usable photography was found on the existing site — the mockup will need images supplied.')
  if (!testimonials.length) notes.push('No testimonials or reviews were found on the existing site. None may be invented for the mockup.')
  if (!services.length) notes.push('No clear service list was found — services will have to come from the business record or be confirmed.')

  return {
    sourceUrl: base.toString(),
    title: title ? strip(title) : null,
    description: description ? decode(description).trim() : null,
    headings: uniqueHeadings,
    services,
    about,
    testimonials: testimonials.slice(0, 8),
    images,
    socials,
    emails,
    phones,
    brandColors,
    fetchedAt: new Date().toISOString(),
    notes,
  }
}
