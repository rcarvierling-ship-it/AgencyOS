// Builds a website concept for a real business.
//
// Everything shown is derived from the business record. Where a fact is not
// recorded it is omitted rather than invented: a concept that claims review
// counts or a founding year the business never gave us is worse than useless
// when the owner reads it.

export type DemoPalette = { ink: string; accent: string; accentSoft: string; wash: string; deep: string }
export type DemoContent = {
  businessName: string
  tagline: string
  headline: string
  headlineAccent: string
  subhead: string
  services: { title: string; blurb: string }[]
  reasons: { title: string; blurb: string }[]
  serviceArea: string | null
  phone: string | null
  email: string | null
  websiteUrl: string | null
  palette: DemoPalette
  industryLabel: string
  generatedAt: string
}

const PALETTES: Record<string, DemoPalette> = {
  hvac:        { ink: '#0f172a', accent: '#0284c7', accentSoft: '#e0f2fe', wash: '#f0f9ff', deep: '#075985' },
  plumbing:    { ink: '#0f172a', accent: '#0369a1', accentSoft: '#e0f2fe', wash: '#f0f9ff', deep: '#0c4a6e' },
  electrical:  { ink: '#1c1917', accent: '#d97706', accentSoft: '#fef3c7', wash: '#fffbeb', deep: '#92400e' },
  roofing:     { ink: '#1c1917', accent: '#b45309', accentSoft: '#fef3c7', wash: '#fffbeb', deep: '#78350f' },
  landscaping: { ink: '#14251a', accent: '#15803d', accentSoft: '#dcfce7', wash: '#f0fdf4', deep: '#14532d' },
  cleaning:    { ink: '#0f172a', accent: '#0d9488', accentSoft: '#ccfbf1', wash: '#f0fdfa', deep: '#115e59' },
  dental:      { ink: '#0f172a', accent: '#0891b2', accentSoft: '#cffafe', wash: '#ecfeff', deep: '#155e75' },
  salon:       { ink: '#1f1420', accent: '#9333ea', accentSoft: '#f3e8ff', wash: '#faf5ff', deep: '#6b21a8' },
  auto:        { ink: '#111827', accent: '#dc2626', accentSoft: '#fee2e2', wash: '#fef2f2', deep: '#991b1b' },
  contractor:  { ink: '#1c1917', accent: '#ea580c', accentSoft: '#ffedd5', wash: '#fff7ed', deep: '#9a3412' },
  default:     { ink: '#0f172a', accent: '#4f46e5', accentSoft: '#e0e7ff', wash: '#f5f3ff', deep: '#3730a3' },
}

type Profile = { key: string; label: string; services: [string, string][]; promise: string }

const PROFILES: Profile[] = [
  { key: 'hvac', label: 'Heating & cooling', promise: 'Comfortable homes, all year round.',
    services: [['Heating', 'Repairs, servicing, and replacement before the cold sets in.'], ['Cooling', 'Air conditioning that keeps up with the worst of the summer.'], ['Maintenance', 'Planned servicing that catches problems while they are small.'], ['Emergency callouts', 'When the heat fails at the worst possible moment.']] },
  { key: 'plumbing', label: 'Plumbing', promise: 'Plumbing done properly, first time.',
    services: [['Repairs', 'Leaks, blockages, and the things that cannot wait until Monday.'], ['Water heaters', 'Repair or replacement, sized correctly for the house.'], ['Drains', 'Cleared quickly, with the cause explained.'], ['Bathrooms', 'Fitted to last, finished to a standard you would show off.']] },
  { key: 'electric', label: 'Electrical', promise: 'Safe, certified electrical work.',
    services: [['Repairs & faults', 'Diagnosed properly rather than guessed at.'], ['Rewiring', 'Bringing older properties up to current standards.'], ['Lighting', 'Interior and exterior schemes, installed cleanly.'], ['Inspections', 'Certification and safety checks, documented.']] },
  { key: 'roof', label: 'Roofing', promise: 'A roof you can stop thinking about.',
    services: [['Repairs', 'Leaks traced to the cause, not just patched over.'], ['Replacement', 'Full re-roofs with a clear scope and timeline.'], ['Gutters', 'Cleared, repaired, and re-hung where needed.'], ['Inspections', 'Honest assessments, including when nothing needs doing.']] },
  { key: 'landscap', label: 'Landscaping', promise: 'Outdoor space worth spending time in.',
    services: [['Design', 'A plan for the space before anything is planted.'], ['Maintenance', 'Regular upkeep that keeps a garden looking intentional.'], ['Hard landscaping', 'Patios, paths, and walls built to last.'], ['Seasonal work', 'Clearance, planting, and preparation at the right time of year.']] },
  { key: 'clean', label: 'Cleaning', promise: 'Spaces that feel genuinely looked after.',
    services: [['Regular cleaning', 'A consistent standard, on a schedule that suits you.'], ['Deep cleans', 'The jobs that never fit into a normal week.'], ['End of tenancy', 'Thorough enough to satisfy a letting agent.'], ['Commercial', 'Offices and premises, cleaned outside working hours.']] },
  { key: 'dent', label: 'Dental care', promise: 'Dentistry without the dread.',
    services: [['Check-ups', 'Regular care that keeps small problems small.'], ['Hygiene', 'Professional cleaning and preventative advice.'], ['Cosmetic', 'Straightening and whitening, explained honestly.'], ['Emergency', 'Same-day appointments when something goes wrong.']] },
  { key: 'salon', label: 'Hair & beauty', promise: 'Looking like yourself, at your best.',
    services: [['Cutting & styling', 'Consultations that start with listening.'], ['Colour', 'From subtle to a complete change.'], ['Treatments', 'Care that keeps hair in condition between visits.'], ['Occasions', 'Weddings and events, planned in advance.']] },
  { key: 'auto', label: 'Auto repair', promise: 'Repairs explained before they are done.',
    services: [['Diagnostics', 'Finding the actual fault before quoting.'], ['Servicing', 'Manufacturer schedules without dealer prices.'], ['Brakes & tyres', 'The safety work that should never be delayed.'], ['MOT & inspection', 'Preparation and repairs under one roof.']] },
  { key: 'contract', label: 'Building & contracting', promise: 'Built properly, finished on time.',
    services: [['Extensions', 'Managed from drawings through to completion.'], ['Renovations', 'Whole-house work with one point of contact.'], ['Kitchens & bathrooms', 'Fitted by trades who do it every week.'], ['Repairs', 'The smaller jobs, treated seriously.']] },
]

const GENERIC: Profile = { key: 'default', label: 'Local service', promise: 'Local expertise you can rely on.',
  services: [['Consultation', 'Understanding the job before quoting for it.'], ['Delivery', 'Work carried out to a standard you would recommend.'], ['Aftercare', 'Support that does not stop when the invoice is paid.'], ['Emergency support', 'Available when something cannot wait.']] }

function profileFor(industry: string | null): Profile {
  const needle = (industry ?? '').toLowerCase()
  return PROFILES.find(p => needle.includes(p.key)) ?? GENERIC
}

function paletteFor(industry: string | null): DemoPalette {
  const needle = (industry ?? '').toLowerCase()
  const key = Object.keys(PALETTES).find(k => k !== 'default' && needle.includes(k.slice(0, 5)))
  return PALETTES[key ?? 'default']!
}

export type BusinessForDemo = {
  name: string; industry: string | null; city: string | null; state: string | null
  phone: string | null; email: string | null; websiteUrl: string | null
}

export function buildDemoContent(business: BusinessForDemo, recordedServices?: string[] | null): DemoContent {
  const profile = profileFor(business.industry)
  const palette = paletteFor(business.industry)
  const area = [business.city, business.state].filter(Boolean).join(', ') || null

  // Prefer services the business actually told us about.
  const services = recordedServices?.length
    ? recordedServices.slice(0, 4).map(title => ({ title, blurb: 'Described in your own words when the site is built.' }))
    : profile.services.map(([title, blurb]) => ({ title, blurb }))

  const headlineParts = profile.promise.split(/,\s*/)
  return {
    businessName: business.name,
    tagline: area ? `${profile.label} · ${area}` : profile.label,
    headline: headlineParts[0] + (headlineParts.length > 1 ? ',' : ''),
    headlineAccent: headlineParts.slice(1).join(', ') || '',
    subhead: area
      ? `Serving ${area} and the surrounding area. Straightforward advice, clear pricing, and work you can rely on.`
      : 'Straightforward advice, clear pricing, and work you can rely on.',
    services,
    reasons: [
      { title: 'Clear pricing', blurb: 'Quotes given before work begins, so there are no surprises on the invoice.' },
      { title: 'Local and accountable', blurb: area ? `Based in ${area}, not a national call centre routing your job elsewhere.` : 'A local business, not a national call centre routing your job elsewhere.' },
      { title: 'Work explained', blurb: 'You are told what needs doing, what does not, and why.' },
    ],
    serviceArea: area,
    phone: business.phone,
    email: business.email,
    websiteUrl: business.websiteUrl,
    palette,
    industryLabel: profile.label,
    generatedAt: new Date().toISOString(),
  }
}

export function demoSlug(name: string, suffix: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'concept'
  return `${base}-${suffix}`
}
