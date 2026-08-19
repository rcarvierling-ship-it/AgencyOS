import { AdminShell } from '../AdminShell'
import { getPipeline } from '../data'
import { getAgencySettings, formatMoney } from '../../../lib/settings'
import PipelineBoard from './PipelineBoard'

export default async function Pipeline() {
  const [rows, settings] = await Promise.all([getPipeline(), getAgencySettings()])
  const items = rows.flatMap((row: any) => (row.businesses ?? []).map((business: any) => ({
    id: business.opportunityId,
    name: business.name,
    slug: business.slug,
    score: business.score ?? null,
    value: business.valueCents != null ? formatMoney(business.valueCents, settings) : null,
    stage: row.stage,
  }))).filter((item: any) => item.id)

  return <AdminShell active="Pipeline" title="Pipeline" subtitle="Your real opportunities, from discovery through close.">
    <div className="card"><div className="filters"><span className="filter">Live database</span><span className="filter">Drag & drop to move</span></div><PipelineBoard initial={items} /></div>
  </AdminShell>
}
