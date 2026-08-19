// Local business discovery via OpenStreetMap.
//
// Overpass needs no key and costs nothing, and OSM carries the one signal this
// agency actually sells against: whether a business has a website tag at all.
// Coverage is uneven — strong in towns and cities, thinner for very small
// operators — so the count returned is what OSM knows about, never a claim
// about how many such businesses exist.

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const OVERPASS = 'https://overpass-api.de/api/interpreter'
// Both services ask that clients identify themselves and keep load modest.
const UA = 'AgencyOS/1.0 (+https://rcvagency.com; local business research)'

export type DiscoveredBusiness = {
  osmId: string
  name: string
  category: string
  websiteUrl: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  lat: number
  lon: number
}

/** OSM tags that actually carry local service businesses, per category. */
const CATEGORY_TAGS: Record<string, string[]> = {
  hvac: ['craft=hvac', 'shop=hvac'],
  plumbing: ['craft=plumber'],
  electrical: ['craft=electrician'],
  roofing: ['craft=roofer'],
  landscaping: ['craft=gardener', 'landuse=plant_nursery', 'shop=garden_centre'],
  'general contractor': ['craft=builder', 'craft=carpenter', 'office=construction_company'],
  'auto repair': ['shop=car_repair', 'shop=tyres'],
  cleaning: ['shop=laundry', 'shop=dry_cleaning', 'craft=cleaning'],
  salon: ['shop=hairdresser', 'shop=beauty', 'leisure=spa'],
  dental: ['amenity=dentist', 'healthcare=dentist'],
  gym: ['leisure=fitness_centre', 'leisure=sports_centre'],
  restaurant: ['amenity=restaurant', 'amenity=cafe'],
  legal: ['office=lawyer'],
  accounting: ['office=accountant', 'office=tax_advisor'],
  veterinary: ['amenity=veterinary'],
}

export const DISCOVERY_CATEGORIES = Object.keys(CATEGORY_TAGS)

export class DiscoveryError extends Error {}

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try { return await work(controller.signal) } finally { clearTimeout(timer) }
}

/** Resolves a place name or postcode to a point. */
export async function geocode(place: string): Promise<{ lat: number; lon: number; label: string }> {
  const url = `${NOMINATIM}?q=${encodeURIComponent(place)}&format=json&limit=1&addressdetails=0`
  const response = await withTimeout(signal =>
    fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal, cache: 'no-store' }), 12_000)
  if (!response.ok) throw new DiscoveryError(`Place lookup failed (${response.status})`)
  const results = await response.json() as any[]
  if (!results?.length) throw new DiscoveryError(`Could not find “${place}”. Try a city and state, or a postcode.`)
  return { lat: Number(results[0].lat), lon: Number(results[0].lon), label: String(results[0].display_name ?? place) }
}

function buildQuery(tags: string[], lat: number, lon: number, radiusMetres: number) {
  const clauses = tags.flatMap(tag => {
    const [k, v] = tag.split('=')
    const filter = `["${k}"="${v}"]`
    // Businesses are mapped as points and as building outlines alike.
    return [`node${filter}(around:${radiusMetres},${lat},${lon});`, `way${filter}(around:${radiusMetres},${lat},${lon});`]
  })
  return `[out:json][timeout:40];(${clauses.join('')});out center tags 200;`
}

export async function discoverBusinesses(opts: { place: string; category: string; radiusMiles: number }) {
  const category = opts.category.trim().toLowerCase()
  const tags = CATEGORY_TAGS[category]
  if (!tags) throw new DiscoveryError(`“${opts.category}” is not a category AgencyOS can search yet.`)

  const radius = Math.round(Math.min(Math.max(opts.radiusMiles, 1), 60) * 1609.34)
  const point = await geocode(opts.place)

  const response = await withTimeout(signal =>
    fetch(OVERPASS, {
      method: 'POST', signal, cache: 'no-store',
      headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(buildQuery(tags, point.lat, point.lon, radius)),
    }), 45_000)

  if (response.status === 429 || response.status === 504) {
    throw new DiscoveryError('OpenStreetMap is rate limiting requests right now. Wait a minute and try again.')
  }
  if (!response.ok) throw new DiscoveryError(`OpenStreetMap search failed (${response.status})`)

  const payload = await response.json() as { elements?: any[] }
  const seen = new Set<string>()
  const businesses: DiscoveredBusiness[] = []

  for (const el of payload.elements ?? []) {
    const t = el.tags ?? {}
    const name = String(t.name ?? '').trim()
    if (!name) continue                                    // unnamed features are not businesses we can act on
    const key = name.toLowerCase()
    if (seen.has(key)) continue                            // same business mapped as both node and way
    seen.add(key)

    const website = t.website || t['contact:website'] || t.url || null
    businesses.push({
      osmId: `${el.type}/${el.id}`,
      name,
      category: opts.category,
      websiteUrl: website ? String(website) : null,
      phone: t.phone || t['contact:phone'] || null,
      address: [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ') || null,
      city: t['addr:city'] ?? null,
      state: t['addr:state'] ?? null,
      postalCode: t['addr:postcode'] ?? null,
      lat: el.lat ?? el.center?.lat ?? point.lat,
      lon: el.lon ?? el.center?.lon ?? point.lon,
    })
  }

  // A business with no website is the whole point, so surface those first.
  businesses.sort((a, b) => Number(Boolean(a.websiteUrl)) - Number(Boolean(b.websiteUrl)))
  return { place: point.label, businesses }
}
