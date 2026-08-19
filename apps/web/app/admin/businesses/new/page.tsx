import Link from 'next/link'
import { AdminShell, Card } from '../../AdminShell'
import { BusinessForm } from '../../CrmForms'
import { requireUser } from '../../../../lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function NewBusiness() {
  await requireUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  return <AdminShell active="Businesses" title="Add a business" subtitle="Create a business record by hand — a referral, a walk-in, or one you found yourself.">
    <div className="actions"><Link className="secondary" href="/admin/businesses">← Businesses</Link></div>
    <Card eyebrow="New record" title="Business details">
      <BusinessForm />
    </Card>
  </AdminShell>
}
