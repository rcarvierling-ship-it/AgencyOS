import { AdminShell, Card, EmptyState, Pill } from '../AdminShell'
import DiscoveryForm from './DiscoveryForm'
import { getBusinesses } from '../data'

export default async function Discovery() {
  const businesses = await getBusinesses(100)
  return <AdminShell active="Businesses" title="Lead Discovery" subtitle="Find real local service businesses and turn qualified prospects into opportunities.">
    <Card eyebrow="Search" title="Discover local businesses"><DiscoveryForm /></Card>
    <Card eyebrow="Live database" title="Recently discovered">
      {businesses.length ? <table className="table"><thead><tr><th>Business</th><th>Industry</th><th>Website</th><th>Location</th><th>Score</th></tr></thead><tbody>{businesses.slice(0,20).map(b=><tr key={b.id}><td><a href={`/admin/businesses/${b.slug}`}>{b.name}</a></td><td>{b.industry || '—'}</td><td>{b.websiteUrl ? <a href={b.websiteUrl} target="_blank" rel="noreferrer">Existing site</a> : <Pill tone="amber">No website</Pill>}</td><td>{[b.city,b.state].filter(Boolean).join(', ') || '—'}</td><td>{b.opportunityScore ?? '—'}</td></tr>)}</tbody></table> : <EmptyState title="No businesses yet" body="Discovery is connected to the real AgencyOS database. Run your first search to create records." />}
    </Card>
  </AdminShell>
}
