import Link from 'next/link'
import { AdminShell, Card, EmptyState } from '../../../AdminShell'
import { BusinessForm } from '../../../CrmForms'
import { getBusiness } from '../../../data'
import { requireUser } from '../../../../../lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function EditBusiness({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  const { slug } = await params
  const data = await getBusiness(slug)
  if (!data) return <AdminShell active="Businesses" title="Business not found" subtitle="No matching record exists.">
    <EmptyState title="Business not found" body="This profile does not exist in the AgencyOS database." href="/admin/businesses" label="Back to businesses" />
  </AdminShell>

  const b = data.business
  const values = {
    id: b.id, slug: b.slug, name: b.name ?? '', industry: b.industry ?? '', websiteUrl: b.websiteUrl ?? '',
    phone: b.phone ?? '', email: b.email ?? '', address: b.address ?? '', city: b.city ?? '',
    state: b.state ?? '', postalCode: b.postalCode ?? '',
    opportunityScore: b.opportunityScore != null ? String(b.opportunityScore) : '', notes: b.notes ?? '',
  }

  return <AdminShell active="Businesses" title={`Edit ${b.name}`} subtitle="Update the permanent record for this business.">
    <div className="actions"><Link className="secondary" href={`/admin/businesses/${b.slug}`}>← Back to profile</Link></div>
    <Card eyebrow="Business record" title="Details"><BusinessForm business={values} /></Card>
  </AdminShell>
}
