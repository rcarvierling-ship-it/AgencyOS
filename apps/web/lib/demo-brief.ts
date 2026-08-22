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
  { key: 'editorial-split', name: 'Editorial split', direction: 'Asymmetric two-column hero, oversized display type on one side. Magazine rhythm, hairline rules, generous margins. Content sits on a strict 12-column grid with deliberate column spans, never a centred stack.' },
  { key: 'centred-statement', name: 'Centred statement', direction: 'One enormous centred claim, one action, nothing else above the fold. Everything below is a narrow centred measure. Closer to a printed poster than a brochure. Requires exceptional type to carry it.' },
  { key: 'stacked-bands', name: 'Stacked colour bands', direction: 'Full-bleed horizontal bands, each owning a different ground colour from the palette. Strong horizontal rhythm and hard edges between sections. No floating cards anywhere on the page.' },
  { key: 'offset-panels', name: 'Offset overlapping panels', direction: 'Panels that deliberately break their grid and overlap, with layered depth and elements bleeding past section boundaries. Asymmetry is the point.' },
  { key: 'sidebar-anchored', name: 'Anchored sidebar', direction: 'A fixed left rail carrying identity, contact and navigation; the content column scrolls beside it. Feels like a considered application rather than a page.' },
  { key: 'mosaic', name: 'Service mosaic', direction: 'A tiled grid of unequal cells forms the whole page structure, content interlocking as one composition. Cells vary in span and weight; nothing is a uniform three-across row.' },
  { key: 'index-list', name: 'Numbered index', direction: 'The page is organised as a numbered index or table of contents — services as a typographic list with rules and numerals, closer to a book contents page than a card grid.' },
  { key: 'oversized-type', name: 'Type as the image', direction: 'Typography carries everything. Display type at extreme scale, set tight, cropped or bleeding off the edge. Colour fields instead of pictures. No photographic element at all.' },
  { key: 'ticket-stub', name: 'Utility document', direction: 'Structured like a well-designed functional document — a ticket, invoice or spec sheet. Monospace accents, rules, labelled fields, tabular alignment. Precise and deliberately unglamorous.' },
  { key: 'diagonal-cut', name: 'Angled sections', direction: 'Sections separated by angled or curved edges rather than horizontal lines, with content aligned to those angles. Motion implied by the geometry itself.' },
]


export type Palette = { key: string; name: string; mode: 'light' | 'dark'; recipe: string }

/**
 * Palettes are assigned rather than left open. Given a free hand, every build
 * reaches for near-black plus a warm accent, and the whole book looks the same.
 */
export const PALETTES: Palette[] = [
  { key: 'paper-ink-red', name: 'Paper, ink and one red', mode: 'light', recipe: 'Warm off-white ground #FAF9F6, near-black text #14110F, one saturated red #D7263D used sparingly for a single action. No greys beyond the type ramp.' },
  { key: 'navy-sand', name: 'Deep navy and sand', mode: 'dark', recipe: 'Deep navy ground #0E1B2A, warm sand #E8D5B7 for type, muted brass #C9A227 for accents. Warm on cool.' },
  { key: 'forest-cream', name: 'Forest and cream', mode: 'light', recipe: 'Cream ground #F5F1E8, deep forest green #1B3A2F for type and blocks, clay #C4632F as the only accent.' },
  { key: 'bone-oxblood', name: 'Bone and oxblood', mode: 'light', recipe: 'Bone ground #EFEAE3, oxblood #6B1F2A for headings and rules, ink #1A1614 for body. Restrained and old-establishment.' },
  { key: 'slate-lime', name: 'Slate and electric lime', mode: 'dark', recipe: 'Cool slate ground #1C2128, electric lime #C8F53C for accents only, near-white #F2F4F5 type. High contrast, modern, no warmth.' },
  { key: 'white-royal', name: 'White and royal blue', mode: 'light', recipe: 'Pure white ground, royal blue #1B4DE4 as a structural colour used in large flat fields, black type. Confident and corporate in the good sense.' },
  { key: 'terracotta-stone', name: 'Terracotta and stone', mode: 'light', recipe: 'Warm stone ground #EDE6DD, terracotta #B4552D, deep brown #33261D type. Earthy, tactile, suits trades.' },
  { key: 'midnight-ice', name: 'Midnight and ice', mode: 'dark', recipe: 'Midnight blue ground #0B1220, ice blue #A8D8F0 accents, cool white type. Clean and clinical.' },
  { key: 'plum-blush', name: 'Plum and blush', mode: 'light', recipe: 'Blush ground #F7EFEF, deep plum #4A2040 type and blocks, dusty rose #C98A9B accent. Softer register.' },
  { key: 'char-amber', name: 'Charcoal and amber', mode: 'dark', recipe: 'True charcoal #1F1F1F, amber #F0A500 accent, warm white type. Industrial.' },
  { key: 'sea-coral', name: 'Sea glass and coral', mode: 'light', recipe: 'Pale sea glass ground #E6F0EE, deep teal #14524B type, coral #FF6B4A for actions.' },
  { key: 'mono-yellow', name: 'Monochrome and yellow', mode: 'light', recipe: 'Pure greyscale throughout, with a single high-chroma yellow #FFE01B carrying every interactive element. Nothing else is coloured.' },
]

/** Specific Google Fonts, so the pairing is a decision rather than a default. */
export const TYPE_PAIRINGS = [
  'Fraunces for display (optical size high, soft weight) with Inter for body',
  'Instrument Serif for display with Geist or Inter for body',
  'Bricolage Grotesque for display with IBM Plex Sans for body',
  'Playfair Display for display with Source Sans 3 for body',
  'Archivo for everything, separated by weight and width alone (600/400, expanded headings)',
  'DM Serif Display for headings with DM Sans for body',
  'Libre Baskerville for headings with Libre Franklin for body',
  'Space Grotesk for display with Inter for body',
  'Newsreader for headings with Public Sans for body',
  'Syne for display with Manrope for body',
]

export type UsedVariation = { archetype: string; palette: string; typePairing: string; mode: string }

export type BuildContext = {
  business: {
    name: string; industry: string | null; city: string | null; state: string | null
    phone: string | null; email: string | null; websiteUrl: string | null; notes: string | null
  }
  research: BusinessResearch | null
  auditFailures: { label: string; detail: string }[]
  used: UsedVariation[]
  demoSlug: string
}

export type Variation = {
  archetype: string; archetypeName: string
  palette: string; paletteName: string; paletteRecipe: string; mode: 'light' | 'dark'
  typePairing: string; seed: string
}

/**
 * Picks a layout, palette and type pairing nobody has had recently. Each axis
 * is drawn from what is left after the recent ones are removed, and light and
 * dark are alternated, because otherwise every concept drifts dark.
 */
export function chooseVariation(used: UsedVariation[], seedSource: string): Variation {
  let hash = 0
  for (let i = 0; i < seedSource.length; i++) hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0
  const pick = <T,>(pool: T[], salt: number) => pool[(hash + salt) % pool.length]!

  const recent = used.slice(0, 6)
  const freshOf = <T,>(all: T[], taken: Set<string>, key: (x: T) => string) => {
    const fresh = all.filter(x => !taken.has(key(x)))
    return fresh.length ? fresh : all
  }

  const archetype = pick(freshOf(ARCHETYPES, new Set(recent.map(u => u.archetype)), a => a.key), 0)

  // Force the opposite mode from the last build so the book alternates.
  const lastMode = used[0]?.mode
  const wantMode = lastMode === 'dark' ? 'light' : lastMode === 'light' ? 'dark' : null
  const byMode = wantMode ? PALETTES.filter(p => p.mode === wantMode) : PALETTES
  const palette = pick(freshOf(byMode.length ? byMode : PALETTES, new Set(recent.map(u => u.palette)), p => p.key), 7)

  const typePairing = pick(freshOf(TYPE_PAIRINGS, new Set(recent.map(u => u.typePairing)), t => t), 13)

  return {
    archetype: archetype.key, archetypeName: archetype.name,
    palette: palette.key, paletteName: palette.name, paletteRecipe: palette.recipe, mode: palette.mode,
    typePairing, seed: hash.toString(36),
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
  no client logos, no statistics, no team names, no certifications — unless listed above
  as known. If you want a trust element and have none, state something true: the service
  area, the services, how to reach them.
${hasSite && r?.images.length
    ? `- Use their real photographs, listed above, at full bleed where the composition wants an image.
- **Use those image URLs exactly as written. Do not alter, widen, or re-parameterise them.**
  They were fetched and confirmed to load before being given to you. Many sites serve
  images through an optimiser that only permits specific widths, so changing a width
  parameter to get a larger image produces a 400 and an empty box on the page. If an
  image is not large enough for the composition you want, change the composition.`
    : `- **There is no photography for this business, so design a page that does not need any.**
  This is the single most important instruction here. Do NOT lay out a photo-led design and
  leave grey rectangles in the holes — a large empty placeholder block reads as broken, not
  minimal, and is worse than no image at all. Instead let type, colour fields, rules, and
  composition carry the page the way a well-set editorial spread does. If you use an image
  slot at all, use exactly one, make it a deliberate compositional element, and caption it
  so the owner knows what to send.`}
- Mark the page as a concept with a small banner: prepared by the agency for ${b.name}, not
  a live website.
- Every phone number a real \`tel:\` link, every email a real \`mailto:\`.
- Responsive and judged on a phone first.`)

  sections.push(`## The bar

This is a sales artefact competing for a real business's attention. It has to look like
work someone paid for.

- **Finish the page.** Header, a hero that earns the fold, services with actual substance,
  something establishing credibility from known facts, service area, a clear contact
  section, footer. A three-element page reads as a wireframe.
- **No dead space.** Every region either carries content or is deliberate negative space
  that makes the composition better. An unexplained empty box is a defect.
- **Type is the main event.** A real modular scale, tight display tracking, comfortable
  measure (60-75 characters), deliberate weight contrast.
- **Detail work matters.** Considered hover and focus states, real spacing rhythm,
  hairlines and rules where they help, no default browser styling anywhere.
- **Edit it.** A concept should be persuasive, not exhaustive — six to eight sections that
  each earn their place, not every idea you had. Length is not quality.

Explicitly forbidden, because they are what generic AI output looks like:
- A centred hero above three equal-width cards above a coloured call-to-action band.
- Large grey or striped placeholder rectangles.
- Default indigo, violet or blue-purple gradients.
- Emoji as icons. Generic stock phrases like "Quality you can trust" or "Excellence in
  everything we do".
- Uniform card grids where every cell is the same size and weight.`)

  sections.push(`## Assigned to this build

No two concepts from this agency may look alike, so the direction is assigned rather than
chosen. Follow all three.

- **Layout: ${archetype.name}** — ${archetype.direction}
- **Palette: ${variation.paletteName}** (${variation.mode}) — ${variation.paletteRecipe}
  Use these colours. Do not substitute a palette you prefer.
- **Typography: ${variation.typePairing}** — load from Google Fonts.
- Variation seed ${variation.seed}.

${ctx.used.length
  ? `Recent concepts used these, none of which may be repeated:\n${ctx.used.slice(0, 6).map(u => `  - ${u.archetype} / ${u.palette} / ${u.mode}`).join('\n')}`
  : 'This is the first concept built, so set the bar.'}`)

  sections.push(`## Output

Write the finished page to \`mockup.html\` in the current working directory.

- One self-contained file: inline CSS, inline any JS, no build step, no local assets.
- External references limited to Google Fonts${r?.images.length ? " and the business's own image URLs above" : ''}.
- Do not write any other file and do not scaffold a project.

Before you stop, look at what you built at desktop and phone width and fix what is wrong.
Then report which skills you loaded and the palette you used.`)

  return sections.join('\n\n')
}
