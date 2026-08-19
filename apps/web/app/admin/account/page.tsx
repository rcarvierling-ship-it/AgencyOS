import { AdminShell, Card, Pill, roleLabels } from '../AdminShell'
import { ChangePassword, SignOut } from './AccountForms'
import { getAccount, requireUser, type AdminRole } from '../../../lib/admin-auth'
import { getAgencySettings, formatDateTime } from '../../../lib/settings'

export const dynamic = 'force-dynamic'

const roleSummary: Record<AdminRole, string> = {
  owner: 'Full control, including team and role management.',
  admin: 'Full operational access; cannot change team roles.',
  manager: 'CRM, pipeline, clients, outreach, and projects.',
  operator: 'Day-to-day operational work.',
  agent: 'Automation and CRM operations; no user or role management.',
  viewer: 'Read-only access to the workspace.',
}

export default async function AccountPage() {
  const user = await requireUser()
  const [account, settings] = await Promise.all([getAccount(), getAgencySettings()])

  return <AdminShell active="Your account" title="Your account" subtitle="Your AgencyOS identity, access level, and sign-in security.">
    <div className="stats">
      <div className="stat"><span>Signed in as</span><strong style={{fontSize:18}}>{user.name}</strong><small style={{color:'#92928c'}}>{user.email}</small></div>
      <div className="stat"><span>Role</span><strong style={{fontSize:18}}>{roleLabels[user.role]}</strong><small style={{color:'#92928c'}}>{roleSummary[user.role]}</small></div>
      <div className="stat"><span>Last sign-in</span><strong style={{fontSize:18}}>{formatDateTime(account?.lastLoginAt, settings)}</strong><small style={{color:'#92928c'}}>{settings.timezone}</small></div>
      <div className="stat"><span>Account created</span><strong style={{fontSize:18}}>{formatDateTime(account?.createdAt, settings)}</strong><small style={{color:'#92928c'}}>Workspace member</small></div>
    </div>

    <Card eyebrow="Security" title="Change your password">
      <ChangePassword />
    </Card>

    <Card eyebrow="Session" title="Sign out">
      <div className="detail">
        <p className="muted" style={{margin:'0 0 14px',lineHeight:1.7}}>
          Ends this session on this device. Changing your password signs out every other device automatically.
        </p>
        <SignOut />
      </div>
    </Card>

    {user.role === 'owner' && <Card eyebrow="Owner" title="About the owner account">
      <div className="detail">
        <p className="muted" style={{margin:0,lineHeight:1.7}}>
          The owner role cannot be reassigned or removed through the team page, which is what keeps it safe from
          accidental lockout. Rotating the owner password is only possible here, on your own account.
        </p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
          <Pill tone="purple">Owner</Pill><Pill tone="green">Protected</Pill>
        </div>
      </div>
    </Card>}
  </AdminShell>
}
