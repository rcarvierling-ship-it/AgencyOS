import { AdminShell, Card, Pill } from '../AdminShell'
import { requireUser, listUsers } from '../../../lib/admin-auth'
import { TeamManager } from './TeamManager'
import { getAgencySettings } from '../../../lib/settings'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const user = await requireUser(['owner'])
  const [users, settings] = await Promise.all([listUsers(), getAgencySettings()])
  return <AdminShell active="Team & Access" title="Team & Access" subtitle="Control who can enter AgencyOS and exactly what they are allowed to do.">
    <div className="stats">
      <div className="stat"><span>Team members</span><strong>{users.length}</strong></div>
      <div className="stat"><span>Active accounts</span><strong>{users.filter((u:any) => u.active).length}</strong></div>
      <div className="stat"><span>Agent accounts</span><strong>{users.filter((u:any) => u.role === 'agent').length}</strong></div>
      <div className="stat"><span>Your role</span><strong>Owner</strong></div>
    </div>
    <Card eyebrow="Access control" title="Agency users">
      <TeamManager initialUsers={users} currentUserId={user.id} timezone={settings.timezone} />
    </Card>
    <Card eyebrow="Recommended for OpenClaw" title="Create a dedicated agent account">
      <div className="empty" style={{paddingTop:18,paddingBottom:18}}>
        <h3>Use the Agent role for OpenClaw</h3>
        <p>Give your OpenClaw agent its own email and password instead of sharing your owner credentials. Agent accounts can work inside the operational workspace while role and account management remain owner-only.</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}><Pill tone="purple">Agent</Pill><Pill tone="green">Individual login</Pill><Pill>Owner-controlled</Pill></div>
      </div>
    </Card>
  </AdminShell>
}
