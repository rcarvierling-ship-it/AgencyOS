import Link from 'next/link'
import { AdminShell, Card, Pill, Stat, EmptyState } from '../AdminShell'
import { getBusinesses } from '../data'
import { PIPELINE_STAGES, stageLabel } from '../../../lib/pipeline'
import { requireUser } from '../../../lib/admin-auth'
import styles from '../CrmForms.module.css'

export const dynamic = 'force-dynamic'

export default async function Businesses({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  const { q = '', stage = '' } = await searchParams
  const [user, businesses] = await Promise.all([requireUser(), getBusinesses(250, { q, stage })])
  const filtering = Boolean(q || stage)
  const canWrite = user.role !== 'viewer'

  const qualified = businesses.filter(b => ['qualified', 'researching', 'demo_ready', 'contacted', 'interested', 'proposal'].includes(b.status)).length
  const noWebsite = businesses.filter(b => !b.websiteUrl).length

  return <AdminShell active="Businesses" title="Businesses" subtitle="Your real prospect and client business graph."
    action={canWrite ? <Link className="primary" href="/admin/businesses/new">＋ New business</Link> : undefined}>
    <div className="stats">
      <Stat label={filtering ? 'Matching businesses' : 'Total businesses'} value={String(businesses.length)} />
      <Stat label="Qualified" value={String(qualified)} />
      <Stat label="No website" value={String(noWebsite)} />
      <Stat label="Scored" value={String(businesses.filter(b => b.opportunityScore != null).length)} />
    </div>

    <Card title="Business directory">
      <form className="filters" method="get" action="/admin/businesses">
        <input className="filter" style={{ minWidth: 220 }} type="search" name="q" defaultValue={q} placeholder="Search name, city, industry, email" aria-label="Search businesses" />
        <select className="filter" name="stage" defaultValue={stage} aria-label="Filter by stage">
          <option value="">All stages</option>
          {PIPELINE_STAGES.map(s => <option key={s} value={s}>{stageLabel(s)}</option>)}
          <option value="lost">Lost</option>
        </select>
        <button className={styles.primary} style={{ height: 32, fontSize: 9, padding: '0 14px' }} type="submit">Search</button>
        {filtering && <Link className="filter" href="/admin/businesses">Clear</Link>}
      </form>

      {businesses.length ? <table className="table">
        <thead><tr><th>Business</th><th>Industry</th><th>Stage</th><th>Opportunity</th><th>Location</th></tr></thead>
        <tbody>{businesses.map(b => <tr key={b.id}>
          <td><Link href={`/admin/businesses/${b.slug}`}>{b.name}</Link></td>
          <td>{b.industry || '—'}</td>
          <td><Pill>{stageLabel(b.status)}</Pill></td>
          <td><b>{b.opportunityScore ?? '—'}{b.opportunityScore != null ? '/100' : ''}</b></td>
          <td>{[b.city, b.state].filter(Boolean).join(', ') || '—'}</td>
        </tr>)}</tbody>
      </table> : filtering
        ? <EmptyState title="No matches" body="No business matches that search. Try a different term or clear the filters." href="/admin/businesses" label="Clear filters" />
        : <EmptyState title="No businesses yet" body="There is no sample data here. Add your first business by hand, or connect lead discovery." href="/admin/businesses/new" label="Add a business" />}
    </Card>
  </AdminShell>
}
