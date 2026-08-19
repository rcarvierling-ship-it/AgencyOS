import Link from 'next/link'
import { AdminShell, Card, Stat, Pill, EmptyState } from '../AdminShell'
import { DemoReview } from '../DemoActions'
import { getDemos } from '../data'
import { getAgencySettings, formatDateTime } from '../../../lib/settings'
import { requireUser } from '../../../lib/admin-auth'

export const dynamic = 'force-dynamic'

const TONE = { approved: 'green', ready: 'blue', rejected: 'neutral', generating: 'amber' } as const

export default async function Demos() {
  const [user, demos, settings] = await Promise.all([requireUser(), getDemos(), getAgencySettings()])
  const canReview = ['owner', 'admin', 'manager'].includes(user.role)
  const approved = demos.filter(d => d.status === 'approved').length
  const awaiting = demos.filter(d => d.status === 'ready').length

  return <AdminShell active="Demos" title="Demos" subtitle="Website concepts built from real business records, reviewed before any outreach.">
    <div className="stats">
      <Stat label="Concepts" value={String(demos.length)} />
      <Stat label="Awaiting review" value={String(awaiting)} />
      <Stat label="Approved" value={String(approved)} />
      <Stat label="Rejected" value={String(demos.filter(d => d.status === 'rejected').length)} />
    </div>
    <Card eyebrow="Review queue" title="Concepts">
      {demos.length ? <div className="list">{demos.map((d: any) => <div className="listItem" key={d.id}>
        <div>
          <b>{d.name}</b>
          <span>Generated {formatDateTime(d.createdAt, settings)}{d.approvedAt ? ` · approved ${formatDateTime(d.approvedAt, settings)}` : ''}</span>
        </div>
        <div className="actions" style={{ marginBottom: 0, alignItems: 'center' }}>
          <Pill tone={TONE[d.status as keyof typeof TONE] ?? 'neutral'}>{d.status}</Pill>
          {d.previewUrl && <a className="secondary" href={d.previewUrl} target="_blank" rel="noreferrer">Open concept ↗</a>}
          <Link className="secondary" href={`/admin/businesses/${d.businessSlug}`}>Business</Link>
          {canReview && <DemoReview demoId={d.id} status={d.status} />}
        </div>
      </div>)}</div> : <EmptyState title="No concepts yet" body="Generate a concept from a business profile. It is built from that business's own details, so the record should be filled in first." href="/admin/businesses" label="Open businesses" />}
    </Card>
  </AdminShell>
}
