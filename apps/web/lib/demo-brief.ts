// Composes the prompt Claude Code is given to build one mockup.
//
// Two rules govern everything here. Only material we actually observed may be
// stated as fact — a concept that invents a review or a founding year is worse
// than useless the moment the owner reads it. And no two mockups may look
// alike, which is enforced by assigning a layout archetype server-side and
// forbidding the ones already used, rather than hoping for variety.

import type { BusinessResearch } from './research'

export type Archetype = {
  key: string
  name: string
  direction: string
}

export const ARCHETYPES: Archetype[] = [
  { key: 'editorial-split', name: 'Editorial split', direction: 'Asymmetric hero with oversized display type on one side and a single strong photograph on the other. Generous margins, magazine rhythm, hairline rules between sections.' },
  { key: 'full-bleed', name: 'Full-bleed image', direction: 'Hero is one edge-to-edge photograph with the headline set over it. Content below sits on a calm neutral ground so the image does the shouting.' },
  { key: 'centred-statement', name: 'Centred statement', direction: 'Centred, confident single-column hero with one enormous claim and one action. Everything below is centred and narrow, closer to a poster than a brochure.' },
  { key: 'stacked-bands', name: 'Stacked colour bands', direction: 'Full-width alternating colour bands, each section owning its own ground. Strong horizontal rhythm; no cards floating on a neutral page.' },
  { key: 'offset-panels', name: 'Offset overlapping panels', direction: 'Panels that deliberately overlap and break their grid, with layered depth and a photograph bleeding under a content card.' },
  { key: 'sidebar-anchored', name: 'Anchored sidebar', direction: 'A persistent left rail carrying identity, phone and navigation, with the content column scrolling beside it. Feels like a considered app, not a template.' },
  { key: 'mosaic', name: 'Service mosaic', direction: 'A tiled grid of unequal cells forms the primary structure, services and photography interlocking as one composition.' },
]

export const TYPE_PAIRINGS = [
  'A high-contrast serif for headings against a neutral grotesque for body',
  'A single geometric sans across the whole page, separated by weight and size alone',
  'A condensed display face for headings with a humanist sans for body',
  'A warm slab serif for headings with a clean grotesque for body',
  'A modern grotesque for headings with a readable serif for body copy',
]

export type BuildContext = {
  business: {
    name: string; industry: string | null; city: string | null; state: string | null
    phone: string | null; email: string | null; websiteUrl: string | null; notes: string | null
  }
  research: BusinessResearch | null
  auditFailures: { label: string; detail: string }[]
  usedArchetypes: string[]
  demoSlug: string
}

export type Variation = { archetype: string; archetypeName: string; typePairing: string; seed: string }

/** Picks a layout this business has not had and, where possible, nobody else has either. */
export function chooseVariation(usedArchetypes: string[], seedSource: string): Variation {
  const used = new Set(usedArchetypes)
  const fresh = ARCHETYPES.filter(a => !used.has(a.key))
  const pool = fresh.length ? fresh : ARCHETYPES
  let hash = 0
  for (let i = 0; i < seedSource.length; i++) hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0
  const archetype = pool[hash % pool.length]!
  return {
    archetype: archetype.key,
    archetypeName: archetype.name,
    typePairing: TYPE_PAIRINGS[hash % TYPE_PAIRINGS.length]!,
    seed: hash.toString(36),
  }
}

function bullet(items: string[]) { return items.map(i => `- ${i}`).join('\n') }

export function buildBrief(ctx: BuildContext, variation: Variation): string {
  const b = ctx.business
  const r = ctx.research
  const archetype = ARCHETYPES.find(a => a.key === variation.archetype)!
  const area = [b.city, b.state].filter(Boolean).join(', ')
  const hasSite = Boolean(b.websiteUrl)

  const known: string[] = [`Business name: ${b.name}`]
  if (b.industry) known.push(`Industry: ${b.industry}`)
  if (area) known.push(`Location / service area: ${area}`)
  if (b.phone) known.push(`Phone: ${b.phone}`)
  if (b.email) known.push(`Email: ${b.email}`)
  if (b.websiteUrl) known.push(`Existing website: ${b.websiteUrl}`)
  if (b.notes) known.push(`Internal notes: ${b.notes}`)

  const sections: string[] = []

  sections.push(`# Build a website concept for ${b.name}

You are building a **concept mockup** for a real local business. It is a sales artefact:
${b.name} has not hired us. They will open this and decide whether the agency that made
it is worth talking to. It must look like a site they would be proud to own.

This is NOT their production site. It is a single self-contained page.`)

  sections.push(`## Use these skills

Invoke BOTH with the Skill tool before writing any markup. These are exact skill
names — do not substitute or approximate them:

1. \`impeccable\` — design direction, craft, and the verification pass.
2. \`design-taste-frontend\` — anti-generic judgement, so this does not read as a template.

Do not skip either, and do not proceed on your own taste alone. If a named skill does
not resolve, say so in your final message rather than continuing silently — a concept
built without them is not what was asked for.`)

  sections.push(`## What is actually known about this business

${bullet(known)}`)

  if (r) {
    const found: string[] = []
    if (r.title) found.push(`Their current page title: "${r.title}"`)
    if (r.description) found.push(`Their meta description: "${r.description}"`)
    if (r.services.length) found.push(`Services named on their site: ${r.services.join(', ')}`)
    if (r.about) found.push(`Their own about copy (rewrite, do not copy verbatim): "${r.about}"`)
    if (r.headings.length) found.push(`Headings from their site: ${r.headings.slice(0, 12).join(' · ')}`)
    if (r.brandColors.length) found.push(`Colours currently used on their site: ${r.brandColors.join(', ')}`)
    if (r.socials.length) found.push(`Social profiles: ${r.socials.join(' ')}`)

    sections.push(`## Researched from their existing site

${bullet(found)}`)

    if (r.testimonials.length) {
      sections.push(`### Real testimonials from their own site

Use these verbatim, attributed as they appear. Do not edit their wording, and do not
add any others.

${r.testimonials.map(t => `> ${t.quote}${t.attribution ? `\n> — ${t.attribution}` : ''}`).join('\n\n')}`)
    }

    if (r.images.length) {
      sections.push(`### Their real photography

Hotlink these directly. They are the business's own images and are what make this
concept theirs rather than generic.

${bullet(r.images)}`)
    }

    if (r.notes.length) sections.push(`### Gaps found during research\n\n${bullet(r.notes)}`)
  }

  if (ctx.auditFailures.length) {
    sections.push(`## What is wrong with their current site

The concept must visibly fix each of these. This is the argument the agency is making.

${bullet(ctx.auditFailures.map(f => `**${f.label}** — ${f.detail}`))}`)
  }

  sections.push(`## Rules you may not break

- **Invent nothing.** No review counts, no star ratings, no years in business, no awards,
  no client logos, no statistics, no team member names — unless listed above as known.
  If you want a trust element and have no real one, use a factual statement drawn only
  from what is known (service area, services offered, how to reach them).
${hasSite && r?.images.length
    ? `- Use their real photographs listed above.`
    : `- **You have no photography for this business.** Do not use stock photos of people,
  and do not generate images of a business that is not theirs. Instead design deliberate,
  clearly-labelled image placeholders that look intentional — captioned blocks reading
  e.g. "Your team here" or "Your work here" — so the layout reads as finished and the
  owner can see exactly what to send. A confident placeholder is better than a stranger's
  face.`}
- Mark the page as a concept: it must carry a small fixed banner saying it is a concept
  prepared by the agency for ${b.name} and not a live website.
- Every phone number must be a real \`tel:\` link. Every email a real \`mailto:\`.
- Fully responsive. It will be judged on a phone first.`)

  sections.push(`## Design direction assigned to this build

No two concepts from this agency may look alike. This one has been assigned:

- **Layout archetype: ${archetype.name}** — ${archetype.direction}
- **Typography: ${variation.typePairing}**
- **Variation seed: ${variation.seed}**

${ctx.usedArchetypes.length
  ? `Archetypes already used for other businesses, which you must NOT reproduce: ${ctx.usedArchetypes.join(', ')}.`
  : 'This is the first concept built, so set the bar.'}

Choose a colour palette that suits **this** business and its trade — not a default
indigo. Google Fonts may be linked.`)

  sections.push(`## Output

Write the finished page to \`mockup.html\` in the current working directory.

- One self-contained file: inline CSS, inline any JS, no build step, no local assets.
- External references limited to Google Fonts and the business's own image URLs above.
- Do not write any other file. Do not create a project scaffold.

When \`mockup.html\` is written and you are satisfied with it, stop.`)

  return sections.join('\n\n')
}
