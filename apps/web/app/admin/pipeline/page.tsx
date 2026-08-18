import Link from 'next/link'
import { AdminShell, EmptyState, Pill } from '../AdminShell'
import { getPipeline } from '../data'

const order = ['discovered','qualified','researching','demo_ready','contacted','interested','proposal','won']
export default async function Pipeline() {
  const rows = await getPipeline()
  const byStage = new Map(rows.map((r:any) => [r.stage, r]))
  const hasData = rows.length > 0
  return <AdminShell active="Pipeline" title="Pipeline" subtitle="Your real opportunities, from discovery through close.">
    <div className="card"><div className="filters"><span className="filter">Live database</span><span className="filter">All stages</span></div>{hasData ? <div className="pipeline">{order.map(stage => { const row:any = byStage.get(stage); const items = row?.businesses ?? []; return <div className="stage" key={stage}><div className="stageHead"><span>{stage.replaceAll('_',' ')}</span><b>{row?.count ?? 0}</b></div>{items.map((item:any)=><Link className="item" href={`/admin/businesses/${item.slug}`} key={item.slug}><b>{item.name}</b><span>{item.score != null ? `Opportunity ${item.score}/100` : 'No score yet'}</span></Link>)}</div> })}</div> : <EmptyState title="Pipeline is empty" body="No opportunities exist yet. Add real businesses and create opportunities to see them here." href="/admin/discovery" label="Start discovery" />}</div>
  </AdminShell>
}
