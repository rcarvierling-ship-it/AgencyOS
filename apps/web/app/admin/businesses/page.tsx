import Link from 'next/link'
import { AdminShell, Card, Pill, Stat, EmptyState } from '../AdminShell'
import { getBusinesses } from '../data'

export default async function Businesses() {
  const businesses = await getBusinesses(250)
  const qualified = businesses.filter(b => ['qualified','researching','demo_ready','contacted','interested','proposal'].includes(b.status)).length
  const research = businesses.filter(b => b.status === 'researching').length
  return <AdminShell active="Businesses" title="Businesses" subtitle="Your real prospect and client business graph.">
    <div className="stats"><Stat label="Total businesses" value={String(businesses.length)} /><Stat label="Qualified" value={String(qualified)} /><Stat label="Needs research" value={String(research)} /><Stat label="New records" value={String(businesses.filter(b => Date.now() - new Date((b as any).updatedAt ?? 0).getTime() < 7*86400000).length)} /></div>
    <Card title="Business directory">
      {businesses.length ? <><div className="filters"><input className="filter" placeholder="⌕ Search businesses" /><span className="filter">All stages</span><span className="filter">Industry</span><span className="filter">Website quality</span></div><table className="table"><thead><tr><th>Business</th><th>Industry</th><th>Stage</th><th>Opportunity</th><th>Location</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><Link href={`/admin/businesses/${b.slug}`}>{b.name}</Link></td><td>{b.industry || '—'}</td><td><Pill>{b.status}</Pill></td><td><b>{b.opportunityScore ?? '—'}{b.opportunityScore !== null ? '/100':''}</b></td><td>{[b.city,b.state].filter(Boolean).join(', ') || '—'}</td></tr>)}</tbody></table></> : <EmptyState title="No businesses in the database" body="There is no sample data here. Run discovery or add your first real business to begin." href="/admin/discovery" label="Start discovery" />}
    </Card>
  </AdminShell>
}
