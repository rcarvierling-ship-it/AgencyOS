import Link from 'next/link'
import { AdminShell, Card, Pill, Stat, EmptyState } from '../AdminShell'
import { OutreachStatus } from '../OutreachActions'
import { getOutreach } from '../data'
import { getAgencySettings, formatDateTime } from '../../../lib/settings'
import { isEmailProviderConfigured } from '../../../lib/outreach'
import { requireUser } from '../../../lib/admin-auth'

export const dynamic = 'force-dynamic'

const TONE: Record<string, 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'purple'> = {
  draft: 'neutral', approved: 'blue', sent: 'purple', opened: 'blue',
  replied: 'amber', interested: 'green', declined: 'red', no_response: 'neutral', bounced: 'red',
}

export default async function Outreach() {
  const [user, messages, settings] = await Promise.all([requireUser(), getOutreach(), getAgencySettings()])
  const canWrite = user.role !== 'viewer'
  const providerReady = isEmailProviderConfigured()

  const sent = messages.filter(m => ['sent', 'opened', 'replied', 'interested', 'declined'].includes(m.status)).length
  const replied = messages.filter(m => ['replied', 'interested', 'declined'].includes(m.status)).length
  const interested = messages.filter(m => m.status === 'interested').length

  return <AdminShell active="Outreach" title="Outreach" subtitle="Personalised messages built from each business's own audit and concept.">
    <div className="stats">
      <Stat label="Messages" value={String(messages.length)} />
      <Stat label="Sent" value={String(sent)} />
      <Stat label="Replies" value={String(replied)} />
      <Stat label="Interested" value={String(interested)} />
    </div>

    {!providerReady && <div className="card"><div className="detail">
      <div className="kv"><b>Email provider</b><Pill tone="amber">Not configured</Pill></div>
      <p className="muted" style={{ margin: '12px 0 0', lineHeight: 1.7 }}>
        AgencyOS drafts and tracks messages but cannot send them yet. Set <code>OUTREACH_EMAIL_API_KEY</code> and{' '}
        <code>OUTREACH_EMAIL_FROM</code> to enable sending. Until then, send a message from your own mail client and
        mark it sent here to confirm it really went out — nothing is recorded as sent unless it actually was.
      </p>
      {!settings.postalAddress && <p className="muted" style={{ margin: '10px 0 0', lineHeight: 1.7 }}>
        No postal address is set in <Link className="link" href="/admin/settings">Settings</Link>. Commercial email is
        required to carry one, and drafts will flag this until it is filled in.
      </p>}
    </div></div>}

    <Card eyebrow="Messages" title="Outreach queue">
      {messages.length ? <div className="list">{messages.map((m: any) => <div className="listItem" key={m.id}>
        <div style={{ minWidth: 0 }}>
          <b>{m.name}{m.doNotContact ? ' · do not contact' : ''}</b>
          <span>{m.subject}</span>
          <span style={{ display: 'block', marginTop: 3 }}>
            {m.toEmail ?? 'No email address'} · drafted {formatDateTime(m.createdAt, settings)}
            {m.sentAt ? ` · sent ${formatDateTime(m.sentAt, settings)}` : ''}
          </span>
          {m.metadata?.warnings?.length ? <span style={{ display: 'block', marginTop: 4, color: '#9a6a16' }}>
            {m.metadata.warnings.join(' ')}
          </span> : null}
        </div>
        <div className="actions" style={{ marginBottom: 0, alignItems: 'center' }}>
          <Pill tone={TONE[m.status] ?? 'neutral'}>{m.status.replace('_', ' ')}</Pill>
          {m.demoSlug && <a className="secondary" href={`/demo/${m.demoSlug}`} target="_blank" rel="noreferrer">Concept ↗</a>}
          <Link className="secondary" href={`/admin/businesses/${m.slug}`}>Business</Link>
          {canWrite && <OutreachStatus messageId={m.id} status={m.status} />}
        </div>
      </div>)}</div> : <EmptyState title="No outreach yet" body="Draft a message from a business profile. It is written from that business's audit findings and approved concept, so run those first." href="/admin/businesses" label="Open businesses" />}
    </Card>
  </AdminShell>
}
