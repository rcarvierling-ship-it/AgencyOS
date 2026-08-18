'use client'

import { FormEvent, useEffect, useState } from 'react'
import styles from './SettingsForm.module.css'

type Settings = {
  agencyName: string
  websiteUrl: string
  timezone: string
  currency: string
  defaultPipelineStage: string
  defaultOpportunityValueCents: number
  defaultOpportunityProbability: number
  notifications: {
    newBusiness: boolean
    demoReady: boolean
    outreachReply: boolean
    pipelineMovement: boolean
    clientActivity: boolean
  }
}

const fallback: Settings = {
  agencyName: 'RCV Agency',
  websiteUrl: 'https://rcvagency.com',
  timezone: 'America/New_York',
  currency: 'USD',
  defaultPipelineStage: 'discovered',
  defaultOpportunityValueCents: 250000,
  defaultOpportunityProbability: 50,
  notifications: {
    newBusiness: true,
    demoReady: true,
    outreachReply: true,
    pipelineMovement: false,
    clientActivity: true,
  },
}

const stages = [
  ['discovered', 'Discovered'],
  ['qualified', 'Qualified'],
  ['researching', 'Researching'],
  ['demo', 'Demo'],
  ['ready', 'Ready'],
  ['contacted', 'Contacted'],
  ['interested', 'Interested'],
  ['proposal', 'Proposal'],
  ['won', 'Won'],
]

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'UTC',
]

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings>(fallback)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load settings')
        setSettings({ ...fallback, ...data, notifications: { ...fallback.notifications, ...data.notifications } })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load settings'))
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  function updateNotification(key: keyof Settings['notifications'], value: boolean) {
    setSettings((current) => ({ ...current, notifications: { ...current.notifications, [key]: value } }))
    setMessage('')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save settings')
      setSettings({ ...fallback, ...data, notifications: { ...fallback.notifications, ...data.notifications } })
      setMessage('Settings saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.loading}>Loading saved settings…</div>

  return (
    <form onSubmit={save} className={styles.form}>
      <div className={styles.grid}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div><span className={styles.eyebrow}>Workspace</span><h2>Agency profile</h2><p>Identity and regional defaults used across AgencyOS.</p></div>
          </div>
          <div className={styles.fields}>
            <label><span>Agency name</span><input value={settings.agencyName} onChange={(e) => update('agencyName', e.target.value)} required /></label>
            <label><span>Agency website</span><input type="url" value={settings.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} placeholder="https://rcvagency.com" /></label>
            <label><span>Timezone</span><select value={settings.timezone} onChange={(e) => update('timezone', e.target.value)}>{timezones.map((zone) => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}</select></label>
            <label><span>Currency</span><select value={settings.currency} onChange={(e) => update('currency', e.target.value)}><option value="USD">USD — US Dollar</option><option value="CAD">CAD — Canadian Dollar</option><option value="GBP">GBP — Pound Sterling</option><option value="EUR">EUR — Euro</option></select></label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><span className={styles.eyebrow}>Pipeline</span><h2>Opportunity defaults</h2><p>Defaults applied when new opportunities are created.</p></div></div>
          <div className={styles.fields}>
            <label><span>Default pipeline stage</span><select value={settings.defaultPipelineStage} onChange={(e) => update('defaultPipelineStage', e.target.value)}>{stages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Default opportunity value</span><div className={styles.inputPrefix}><b>$</b><input type="number" min="0" step="100" value={Math.round(settings.defaultOpportunityValueCents / 100)} onChange={(e) => update('defaultOpportunityValueCents', Math.round(Number(e.target.value || 0) * 100))} /></div></label>
            <label><span>Default probability</span><div className={styles.inputSuffix}><input type="number" min="0" max="100" value={settings.defaultOpportunityProbability} onChange={(e) => update('defaultOpportunityProbability', Number(e.target.value || 0))} /><b>%</b></div></label>
          </div>
        </section>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}><div><span className={styles.eyebrow}>Notifications</span><h2>What should reach you?</h2><p>These preferences are persisted in the AgencyOS database and will control notification delivery as those channels are connected.</p></div></div>
        <div className={styles.notifications}>
          <Toggle label="New business discovered" detail="Alert when a new potential client enters the system." value={settings.notifications.newBusiness} onChange={(v) => updateNotification('newBusiness', v)} />
          <Toggle label="Demo ready" detail="Alert when an automatically generated demo is ready for review." value={settings.notifications.demoReady} onChange={(v) => updateNotification('demoReady', v)} />
          <Toggle label="Outreach reply" detail="Alert when a prospect responds to outreach." value={settings.notifications.outreachReply} onChange={(v) => updateNotification('outreachReply', v)} />
          <Toggle label="Pipeline movement" detail="Alert when an opportunity changes stage." value={settings.notifications.pipelineMovement} onChange={(v) => updateNotification('pipelineMovement', v)} />
          <Toggle label="Client activity" detail="Alert for meaningful activity on active client accounts." value={settings.notifications.clientActivity} onChange={(v) => updateNotification('clientActivity', v)} />
        </div>
      </section>

      <div className={styles.footer}>
        <div>{error && <span className={styles.error}>{error}</span>}{message && <span className={styles.success}>{message}</span>}</div>
        <button className={styles.save} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  )
}

function Toggle({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className={styles.toggleRow}><span><b>{label}</b><small>{detail}</small></span><button type="button" role="switch" aria-checked={value} className={`${styles.toggle} ${value ? styles.on : ''}`} onClick={() => onChange(!value)}><i /></button></label>
}
