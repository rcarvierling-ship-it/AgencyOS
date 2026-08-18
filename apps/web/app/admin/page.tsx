import Link from 'next/link'
import { AdminShell, Card, Pill, Stat, EmptyState } from './AdminShell'
import { getCounts, getPipeline, getBusinesses } from './data'

export default async function Admin() {
  const [counts, pipeline, businesses] = await Promise.all([getCounts(), getPipeline(), getBusinesses(5)])
  return <AdminShell title="Command Center" subtitle="Your agency, powered by live business data.">
    <div className="stats">
      <Stat label="Businesses" value={String(counts.businesses)} />
      <Stat label="Active opportunities" value={String(counts.opportunities)} />
      <Stat label="Demos ready" value={String(counts.demos_ready)} />
      <Stat label="Clients" value={String(counts.clients)} />
    </div>
    <Card eyebrow="Pipeline" title="Opportunity flow" href="/admin/pipeline">
      {pipeline.length ? <div className="pipeline">{pipeline.map((stage:any)=><Link className="stage" href={`/admin/pipeline?stage=${encodeURIComponent(stage.stage)}`} key={stage.stage}><div className="stageHead"><span>{stage.stage.replaceAll('_',' ')}</span><b>{stage.count}</b></div><div className="stageCount">{stage.count}</div><div className="bar"><i style={{width:`${Math.min(100, Number(stage.count)*5)}%`}} /></div></Link>)}</div> : <EmptyState title="No opportunities yet" body="Run lead discovery to populate your pipeline with real businesses." href="/admin/discovery" label="Open discovery" />}
    </Card>
    <Card eyebrow="Priority queue" title="Businesses to work" href="/admin/businesses">
      {businesses.length ? <table className="table"><thead><tr><th>Business</th><th>Status</th><th>Opportunity</th><th>Location</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><Link href={`/admin/businesses/${b.slug}`}>{b.name}</Link></td><td><Pill>{b.status}</Pill></td><td><b>{b.opportunityScore ?? '—'}{b.opportunityScore !== null ? '/100':''}</b></td><td>{[b.city,b.state].filter(Boolean).join(', ') || '—'}</td></tr>)}</tbody></table> : <EmptyState title="No businesses yet" body="Your dashboard will populate as soon as real businesses are added." href="/admin/discovery" label="Find businesses" />}
    </Card>
  </AdminShell>
}
