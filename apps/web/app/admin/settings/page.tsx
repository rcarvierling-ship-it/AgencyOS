import { AdminShell, Card, Pill } from '../AdminShell'
import { SettingsForm } from './SettingsForm'

type Integration = [name: string, connected: boolean]

export default function Settings() {
  const integrations: Integration[] = [
    ['Database', Boolean(process.env.DATABASE_URL)],
    ['Admin authentication', Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_AUTH_SECRET)],
    ['Vercel', Boolean(process.env.VERCEL)],
    ['GitHub', Boolean(process.env.GITHUB_TOKEN)],
    ['Cloudflare', Boolean(process.env.CLOUDFLARE_API_TOKEN)],
  ]

  const authConfigured = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_AUTH_SECRET)

  return (
    <AdminShell active="Settings" title="Settings" subtitle="Control the real AgencyOS workspace configuration.">
      <SettingsForm />

      <div className="split">
        <Card title="Security">
          <div className="detail">
            <div className="kv">
              <b>Admin authentication</b>
              <Pill tone={authConfigured ? 'green' : 'amber'}>{authConfigured ? 'Configured' : 'Incomplete'}</Pill>
            </div>
            <div className="kv"><b>Session protection</b><span>Signed admin session cookie</span></div>
          </div>
        </Card>
        <Card title="Environment">
          <div className="detail">
            <div className="kv"><b>Deployment</b><span>{process.env.VERCEL_ENV || 'local'}</span></div>
            <div className="kv"><b>Platform</b><span>{process.env.VERCEL ? 'Vercel' : 'Local'}</span></div>
          </div>
        </Card>
      </div>

      <Card title="Integrations">
        <div className="list">
          {integrations.map(([name, connected]) => (
            <div className="listItem" key={name}>
              <div>
                <b>{name}</b>
                <span>{connected ? 'Environment configuration detected' : 'Not configured in this environment'}</span>
              </div>
              <Pill tone={connected ? 'green' : 'amber'}>{connected ? 'Configured' : 'Not configured'}</Pill>
            </div>
          ))}
        </div>
      </Card>
    </AdminShell>
  )
}
