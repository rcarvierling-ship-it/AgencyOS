import Link from 'next/link'
import { AdminShell, Card, Pill, Stat, EmptyState } from '../AdminShell'
import { getContacts } from '../data'
import { getAgencySettings, formatDate } from '../../../lib/settings'

export default async function Contacts() {
  const [contacts, settings] = await Promise.all([getContacts(), getAgencySettings()])
  const withEmail = contacts.filter(c => c.email).length
  const withPhone = contacts.filter(c => c.phone).length
  const inbound = contacts.filter(c => c.source === 'website_contact_form').length

  return <AdminShell active="Contacts" title="Contacts" subtitle="Every real person attached to a business in your workspace.">
    <div className="stats">
      <Stat label="Contacts" value={String(contacts.length)} />
      <Stat label="With email" value={String(withEmail)} />
      <Stat label="With phone" value={String(withPhone)} />
      <Stat label="From the website" value={String(inbound)} />
    </div>
    <Card title="Contact directory" eyebrow="People">
      {contacts.length ? <table className="table">
        <thead><tr><th>Name</th><th>Business</th><th>Email</th><th>Phone</th><th>Source</th><th>Added</th></tr></thead>
        <tbody>{contacts.map(c => <tr key={c.id}>
          <td><b>{c.name}</b>{c.role ? <span style={{display:'block',color:'#999'}}>{c.role}</span> : null}</td>
          <td><Link href={`/admin/businesses/${c.slug}`}>{c.business}</Link></td>
          <td>{c.email ? <a className="link" href={`mailto:${c.email}`}>{c.email}</a> : '—'}</td>
          <td>{c.phone ? <a className="link" href={`tel:${c.phone}`}>{c.phone}</a> : '—'}</td>
          <td><Pill tone={c.source === 'website_contact_form' ? 'blue' : 'neutral'}>{c.source === 'website_contact_form' ? 'Website form' : c.source || 'Manual'}</Pill></td>
          <td>{formatDate(c.createdAt, settings)}</td>
        </tr>)}</tbody>
      </table> : <EmptyState title="No contacts yet" body="Contacts are created automatically when a business submits the website form, and whenever you record a person against a business." href="/admin/businesses" label="View businesses" />}
    </Card>
  </AdminShell>
}
