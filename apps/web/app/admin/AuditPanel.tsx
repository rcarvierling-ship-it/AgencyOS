import { Pill } from './AdminShell'

type Check = { category: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string }

const TONE = { pass: 'green', warn: 'amber', fail: 'red' } as const
const LABEL = { pass: 'Pass', warn: 'Needs work', fail: 'Fail' } as const

export function AuditPanel({ audit }: { audit: any }) {
  const findings = (audit?.findings ?? {}) as { checks?: Check[]; reachable?: boolean; error?: string | null; responseMs?: number | null }
  const checks = findings.checks ?? []
  // Problems first — this is a sales tool, and the failures are the argument.
  const ordered = [...checks].sort((a, b) => ({ fail: 0, warn: 1, pass: 2 })[a.status] - ({ fail: 0, warn: 1, pass: 2 })[b.status])

  return <>
    <div className="detail">
      {findings.reachable === false && <div className="note" style={{ marginBottom: 14 }}>
        {findings.error ? `This site could not be audited: ${findings.error}.` : 'No website is recorded for this business.'}
      </div>}
      {[['Overall', audit.overallScore], ['Design', audit.designScore], ['Mobile', audit.mobileScore], ['Performance', audit.performanceScore], ['SEO', audit.seoScore], ['Accessibility', audit.accessibilityScore], ['Conversion', audit.conversionScore]].map(([label, value]) =>
        <div className="kv" key={String(label)}>
          <b>{label}</b>
          <span>{value != null ? <><b>{String(value)}</b>/100</> : '—'}</span>
        </div>)}
      {findings.responseMs != null && <div className="kv"><b>Response</b><span>{findings.responseMs} ms</span></div>}
    </div>
    {ordered.length > 0 && <div className="list">{ordered.map((check, i) =>
      <div className="listItem" key={`${check.label}-${i}`}>
        <div><b>{check.label}</b><span>{check.detail}</span></div>
        <Pill tone={TONE[check.status]}>{LABEL[check.status]}</Pill>
      </div>)}
    </div>}
  </>
}
