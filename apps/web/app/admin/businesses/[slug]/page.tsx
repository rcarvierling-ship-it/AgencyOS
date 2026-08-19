import Link from 'next/link'
import { AdminShell, Card, Pill, Stat, EmptyState } from '../../AdminShell'
import { ContactForm, ActivityForm } from '../../CrmForms'
import { AuditButton } from '../../AuditButton'
import { GenerateDemo, DemoReview } from '../../DemoActions'
import { AuditPanel } from '../../AuditPanel'
import { getBusiness } from '../../data'
import { getAgencySettings, formatDateTime } from '../../../../lib/settings'
import { requireUser } from '../../../../lib/admin-auth'
import { stageLabel } from '../../../../lib/pipeline'

export const dynamic = 'force-dynamic'

export default async function BusinessDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [user, data, settings] = await Promise.all([requireUser(), getBusiness(slug), getAgencySettings()])
  if (!data) return <AdminShell active="Businesses" title="Business not found" subtitle="No matching real business record exists.">
    <EmptyState title="Business not found" body="This profile does not exist in the AgencyOS database." href="/admin/businesses" label="Back to businesses" />
  </AdminShell>

  const { business, audit, contacts, activities, opportunity, demos } = data
  const canWrite = user.role !== 'viewer'

  return <AdminShell active="Businesses" title={business.name} subtitle="Live business profile, intelligence, activity, and opportunity history.">
    <div className="actions">
      <Link className="secondary" href="/admin/businesses">← Businesses</Link>
      {business.websiteUrl && <a className="secondary" href={business.websiteUrl} target="_blank" rel="noreferrer">Open website ↗</a>}
      {canWrite && <Link className="primary" href={`/admin/businesses/${business.slug}/edit`}>Edit business</Link>}
    </div>

    <div className="stats">
      <Stat label="Opportunity" value={business.opportunityScore != null ? `${business.opportunityScore}/100` : '—'} />
      <Stat label="Website quality" value={audit?.overallScore != null ? `${audit.overallScore}/100` : 'Not audited'} />
      <Stat label="Pipeline stage" value={stageLabel(opportunity?.stage || business.status || '—')} />
      <Stat label="Activities" value={String(activities.length)} />
    </div>

    <div className="detailGrid">
      <Card title="Business intelligence">
        <div className="detail">
          <div className="kv"><b>Location</b><span>{[business.address, business.city, business.state, business.postalCode].filter(Boolean).join(', ') || '—'}</span></div>
          <div className="kv"><b>Industry</b><span>{business.industry || '—'}</span></div>
          <div className="kv"><b>Website</b><span>{business.websiteUrl || 'No website recorded'}</span></div>
          <div className="kv"><b>Phone</b><span>{business.phone || '—'}</span></div>
          <div className="kv"><b>Email</b><span>{business.email || '—'}</span></div>
          <div className="kv"><b>Notes</b><span>{business.notes || '—'}</span></div>
        </div>
      </Card>
      <Card title="Website audit">
        {audit ? <AuditPanel audit={audit} /> : <EmptyState title="Not audited yet" body={business.websiteUrl ? 'Run an audit to score this website and set the opportunity.' : 'This business has no website recorded, which is itself the opportunity. Score it to confirm.'} />}
        {canWrite && <div className="detail" style={{ paddingTop: audit ? 0 : 14 }}><AuditButton businessId={business.id} hasWebsite={Boolean(business.websiteUrl)} /></div>}
      </Card>
    </div>

    <Card eyebrow="Concept" title="Demo website">
      {demos?.length ? <div className="list">{demos.map((d: any) => <div className="listItem" key={d.id}>
        <div><b>/demo/{d.slug}</b><span>Generated {formatDateTime(d.createdAt, settings)}</span></div>
        <div className="actions" style={{ marginBottom: 0, alignItems: 'center' }}>
          <Pill tone={d.status === 'approved' ? 'green' : d.status === 'ready' ? 'blue' : 'neutral'}>{d.status}</Pill>
          <a className="secondary" href={`/demo/${d.slug}`} target="_blank" rel="noreferrer">Open ↗</a>
          {['owner','admin','manager'].includes(user.role) && <DemoReview demoId={d.id} status={d.status} />}
        </div>
      </div>)}</div> : <div className="detail"><p className="muted" style={{ margin: 0 }}>No concept has been built for this business yet. It is generated from the record above, so fill in industry, location, and phone first.</p></div>}
      {canWrite && <div className="detail" style={{ paddingTop: 14 }}><GenerateDemo businessId={business.id} /></div>}
    </Card>

    <Card eyebrow="People" title="Contacts">
      {contacts.length ? <div className="list">{contacts.map((c: any) => <div className="listItem" key={c.id}>
        <div><b>{c.name}</b><span>{[c.role, c.email, c.phone].filter(Boolean).join(' · ') || 'No details recorded'}</span></div>
        <Pill tone={c.source === 'website_contact_form' ? 'blue' : 'neutral'}>{c.source === 'website_contact_form' ? 'Website form' : c.source || 'Manual'}</Pill>
      </div>)}</div> : <div className="detail"><p className="muted" style={{ margin: 0 }}>No contacts recorded yet.</p></div>}
      {canWrite && <ContactForm businessId={business.id} />}
    </Card>

    <Card eyebrow="Timeline" title="Relationship history">
      {canWrite && <ActivityForm businessId={business.id} />}
      {activities.length ? <div className="list">{activities.map((a: any) => <div className="listItem" key={a.id}>
        <div><b>{a.title}</b><span>{a.detail || a.type} · {formatDateTime(a.createdAt, settings)}</span></div>
        <Pill>{a.type}</Pill>
      </div>)}</div> : <div className="detail"><p className="muted" style={{ margin: 0 }}>Nothing recorded against this business yet.</p></div>}
    </Card>
  </AdminShell>
}
