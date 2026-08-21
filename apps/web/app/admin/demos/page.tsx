import Link from 'next/link'
import { AdminShell, Card, Stat, Pill, EmptyState } from '../AdminShell'
import { DemoReview, RequeueBuild } from '../DemoActions'
import { BuildWatcher } from '../BuildWatcher'
import { DemoPreview as DemoPreviewTrigger } from '../DemoPreview'
import { getDemos } from '../data'
import { getAgencySettings, formatDateTime } from '../../../lib/settings'
import { requireUser } from '../../../lib/admin-auth'

export const dynamic = 'force-dynamic'

const TONE = {
  approved: 'green', ready: 'blue', rejected: 'neutral', generating: 'amber', failed: 'red',
} as const

const BUILD_TONE = {
  queued: 'amber', claimed: 'amber', building: 'blue', ready: 'green', failed: 'red', cancelled: 'neutral',
} as const

export default async function Demos() {
  const [user, demos, settings] = await Promise.all([requireUser(), getDemos(), getAgencySettings()])
  const canReview = ['owner', 'admin', 'manager'].includes(user.role)
  const canWrite = user.role !== 'viewer'

  const pending = demos.filter((d: any) => ['queued', 'claimed', 'building'].includes(d.buildStatus)).length
  const broken = demos.filter((d: any) => d.buildStatus === 'failed').length
  const unhealthy = demos.filter((d: any) => d.buildHealth?.warnings?.length).length

  return <AdminShell active="Demos" title="Demos" subtitle="Website concepts built from real business records, reviewed before any outreach.">
    <div className="stats">
      <Stat label="Concepts" value={String(demos.length)} />
      <Stat label="Awaiting review" value={String(demos.filter((d: any) => d.status === 'ready').length)} />
      <Stat label="Approved" value={String(demos.filter((d: any) => d.status === 'approved').length)} />
      <Stat label="Builds in flight" value={String(pending)} />
    </div>

    {pending > 0 && <div className="card"><div className="detail">
      <div className="kv"><b>Build queue</b><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Pill tone="amber">{pending} in flight</Pill><BuildWatcher active={pending} />
      </span></div>
      <p className="muted" style={{ margin: '12px 0 0', lineHeight: 1.7 }}>
        Claude Code runs on your machine rather than here, so the worker picks these up on its
        own and posts the finished page back — nothing to run. This page refreshes itself while
        that happens, and a build takes a few minutes. If a job sits unclaimed for a while,
        check the worker with <code>./tools/install-worker.sh --status</code>.
      </p>
    </div></div>}

    {broken > 0 && <div className="card"><div className="detail">
      <div className="kv"><b>Failed builds</b><Pill tone="red">{broken}</Pill></div>
      <p className="muted" style={{ margin: '12px 0 0', lineHeight: 1.7 }}>
        A failed build is not a rejected concept. Read the error below and retry once the cause is cleared.
      </p>
    </div></div>}

    {unhealthy > 0 && <div className="card"><div className="detail">
      <div className="kv"><b>Concepts with problems</b><Pill tone="red">{unhealthy}</Pill></div>
      <p className="muted" style={{ margin: '12px 0 0', lineHeight: 1.7 }}>
        These were delivered but did not pass inspection — usually images that do not load, which
        show as empty blocks to the prospect. Rebuild them before approving or sending.
      </p>
    </div></div>}

    <Card eyebrow="Review queue" title="Concepts">
      {demos.length ? <div className="list">{demos.map((d: any) => <div className="listItem" key={d.id}
        style={{ flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <b>{d.name}</b>
          <span>
            {d.metadata?.builtBy === 'claude-code' ? 'Built by Claude Code' : 'Template concept'}
            {d.buildVariation?.archetypeName ? ` · ${d.buildVariation.archetypeName}` : ''}
            {' · '}{formatDateTime(d.createdAt, settings)}
          </span>
          {d.buildError && <span style={{ display: 'block', marginTop: 4, color: '#b42318' }}>{d.buildError}</span>}
          {d.buildHealth?.warnings?.length ? <span style={{ display: 'block', marginTop: 5, color: '#b4600f' }}>
            {d.buildHealth.warnings.join(' ')}
          </span> : null}
          {['queued', 'claimed', 'building'].includes(d.buildStatus) && <span style={{ display: 'block', marginTop: 4, color: '#9a6a16' }}>
            {d.buildStatus === 'queued' ? 'Waiting for a worker to claim it.' : `Claimed by ${d.claimedBy ?? 'a worker'} — building.`}
          </span>}
        </div>
        <div className="actions" style={{ marginBottom: 0, alignItems: 'center' }}>
          {d.buildStatus && d.buildStatus !== 'ready' && <Pill tone={BUILD_TONE[d.buildStatus as keyof typeof BUILD_TONE] ?? 'neutral'}>build {d.buildStatus}</Pill>}
          {d.buildHealth?.warnings?.length ? <Pill tone="red">needs attention</Pill> : null}
          <Pill tone={TONE[d.status as keyof typeof TONE] ?? 'neutral'}>{d.status}</Pill>
          <Link className="secondary" href={`/admin/businesses/${d.businessSlug}`}>Business</Link>
          {canWrite && d.buildId && ['failed', 'claimed', 'building'].includes(d.buildStatus) && <RequeueBuild buildId={d.buildId} />}
          {['ready', 'approved'].includes(d.status) && <DemoPreviewTrigger slug={d.slug} businessName={d.name} />}
          {canReview && ['ready', 'approved', 'rejected'].includes(d.status) && <DemoReview demoId={d.id} status={d.status} />}
        </div>
      </div>)}</div> : <EmptyState title="No concepts yet" body="Build one from a business profile. It is composed from that business's own record and audit, so fill those in first." href="/admin/businesses" label="Open businesses" />}
    </Card>
  </AdminShell>
}
