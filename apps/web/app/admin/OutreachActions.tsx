'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './CrmForms.module.css'
import { OUTREACH_STATUSES } from '../../lib/outreach'

export function DraftOutreach({ businessId, disabled }: { businessId: string; disabled?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/outreach`, { method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not draft the message')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not draft the message')
    } finally { setBusy(false) }
  }

  return <div style={{ display: 'grid', gap: 8 }}>
    <button className={styles.primary} onClick={run} disabled={busy || disabled} type="button">
      {busy ? 'Drafting…' : 'Draft outreach email'}
    </button>
    {error && <div className={styles.error}>{error}</div>}
  </div>
}

export function OutreachStatus({ messageId, status }: { messageId: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmSend, setConfirmSend] = useState(false)

  async function set(next: string, confirmSentManually = false) {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/outreach', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messageId, status: next, confirmSentManually }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (data.needsManualConfirmation) { setConfirmSend(true); setError(data.error); return }
        throw new Error(data.error || 'Could not update the message')
      }
      setConfirmSend(false)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the message')
    } finally { setBusy(false) }
  }

  return <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
    <select className="filter" value={status} disabled={busy} aria-label="Outreach status"
      onChange={e => set(e.target.value)}>
      {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
    </select>
    {confirmSend && <button className={styles.primary} style={{ height: 28, fontSize: 9 }} type="button" disabled={busy}
      onClick={() => set('sent', true)}>I sent it myself — confirm</button>}
    {error && <span style={{ color: '#9a2424', fontSize: 8, maxWidth: 260, textAlign: 'right', lineHeight: 1.5 }}>{error}</span>}
  </div>
}
