import Link from 'next/link'
import { AdminShell, Card, Pill, Stat, EmptyState } from '../AdminShell'
import { getProposals } from '../data'
import { getAgencySettings, formatMoney, formatDate } from '../../../lib/settings'
import { stageLabel } from '../../../lib/pipeline'

export default async function Proposals() {
  const [rows, settings] = await Promise.all([getProposals(), getAgencySettings()])
  const open = rows.filter(r => r.stage === 'proposal')
  const won = rows.filter(r => r.stage === 'won')
  const lost = rows.filter(r => r.stage === 'lost')
  const openValue = open.reduce((total, row) => total + (Number(row.valueCents) || 0), 0)
  // Only decided proposals belong in a win rate; open ones have no outcome yet.
  const decided = won.length + lost.length
  const winRate = decided ? `${Math.round((won.length / decided) * 100)}%` : '—'

  return <AdminShell active="Proposals" title="Proposals" subtitle="Opportunities that reached a proposal, and how they resolved.">
    <div className="stats">
      <Stat label="Open proposals" value={String(open.length)} />
      <Stat label="Open value" value={open.length ? formatMoney(openValue, settings) : '—'} />
      <Stat label="Won" value={String(won.length)} />
      <Stat label="Win rate" value={winRate} />
    </div>
    <Card title="Proposal pipeline" eyebrow="Deals">
      {rows.length ? <table className="table">
        <thead><tr><th>Business</th><th>Opportunity</th><th>Stage</th><th>Value</th><th>Probability</th><th>Updated</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
          <td><Link href={`/admin/businesses/${row.slug}`}>{row.business}</Link></td>
          <td>{row.name}{row.lostReason ? <span style={{display:'block',color:'#999'}}>{row.lostReason}</span> : null}</td>
          <td><Pill tone={row.stage === 'won' ? 'green' : row.stage === 'lost' ? 'neutral' : 'amber'}>{stageLabel(row.stage)}</Pill></td>
          <td><b>{formatMoney(row.valueCents, settings)}</b></td>
          <td>{row.probability != null ? `${row.probability}%` : '—'}</td>
          <td>{formatDate(row.updatedAt, settings)}</td>
        </tr>)}</tbody>
      </table> : <EmptyState title="No proposals yet" body="An opportunity appears here once you move it to the Proposal stage on the pipeline board." href="/admin/pipeline" label="Open pipeline" />}
    </Card>
  </AdminShell>
}
