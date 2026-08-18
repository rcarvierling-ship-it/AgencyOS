import Link from 'next/link'
import { AdminShell, Card, EmptyState, Pill } from '../AdminShell'
import { getInquiries } from '../data'

function serviceLabel(value: string | undefined) {
  return ({ 'new-website':'New website', redesign:'Redesign', 'website-and-hosting':'Website + hosting', 'not-sure':'Not sure yet' } as Record<string,string>)[value ?? ''] ?? value ?? 'Website project'
}

export default async function InquiriesPage() {
  const inquiries = await getInquiries()
  return <AdminShell active="Inquiries" title="Project inquiries" subtitle="Website requests submitted through rcvagency.com.">
    <div className="stats"><div className="stat"><span>Inbound inquiries</span><strong>{inquiries.length}</strong><small>Real submissions</small></div><div className="stat"><span>Latest request</span><strong>{inquiries[0] ? new Date(inquiries[0].createdAt).toLocaleDateString() : '—'}</strong><small>Most recent submission</small></div></div>
    <Card title="New business requests" eyebrow="Website contact form">
      {inquiries.length ? <div className="list">{inquiries.map((item:any) => { const meta=item.metadata ?? {}; return <article className="listItem" key={item.id}>
        <div style={{minWidth:0,flex:1}}><div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}><b>{item.business}</b><Pill tone="blue">{serviceLabel(meta.service)}</Pill><Pill tone={item.stage==='won'?'green':'amber'}>{item.stage ?? 'contacted'}</Pill></div><span>{meta.contactName ?? 'Contact'} · {item.businessEmail ?? 'No email'}{item.businessPhone ? ` · ${item.businessPhone}` : ''}</span><p style={{margin:'8px 0 0',lineHeight:1.55,color:'var(--muted)'}}>{item.detail}</p><small style={{display:'block',marginTop:8,color:'var(--muted)'}}>{new Date(item.createdAt).toLocaleString()}</small></div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}><Link className="secondary" href={`/admin/businesses/${item.slug}`}>Open business <span>→</span></Link></div>
      </article> })}</div> : <EmptyState title="No project inquiries yet" body="When a business submits the website contact form, its request will appear here and enter the pipeline automatically." href="/" label="View website" />}
    </Card>
  </AdminShell>
}
