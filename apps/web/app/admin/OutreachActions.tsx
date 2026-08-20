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

export function SendOutreach({ messageId, status, hasEmail }: { messageId: string; status: string; hasEmail: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')

  if (status === 'sent' || !['draft', 'approved'].includes(status)) return null

  async function act(next: 'approve' | 'send') {
    setBusy(true); setError(''); setSent('')
    try {
      if (next === 'approve') {
        const r = await fetch('/api/admin/outreach', {
          method: 'PATCH', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messageId, status: 'approved' }),
        })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Could not approve')
      } else {
        const r = await fetch('/api/admin/outreach/send', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messageId }),
        })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Could not send')
        setSent(`Sent to ${(d.accepted ?? []).join(', ')}`)
      }
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
    } finally { setBusy(false) }
  }

  return <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
    {status === 'draft'
      ? <button className={styles.ghost} style={{ height: 32, fontSize: 9 }} disabled={busy} type="button" onClick={() => act('approve')}>
          {busy ? 'Approving…' : 'Approve'}
        </button>
      : <button className={styles.primary} style={{ height: 32, fontSize: 9 }} disabled={busy || !hasEmail} type="button" onClick={() => act('send')}
          title={hasEmail ? undefined : 'No recipient address on this message'}>
          {busy ? 'Sending…' : 'Send'}
        </button>}
    {sent && <span style={{ color: '#176b39', fontSize: 8 }}>{sent}</span>}
    {error && <span style={{ color: '#9a2424', fontSize: 8, maxWidth: 300, textAlign: 'right', lineHeight: 1.5 }}>{error}</span>}
  </div>
}

export function VerifySmtp() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string; host?: string; from?: string } | null>(null)

  async function run() {
    setBusy(true); setResult(null)
    try {
      const r = await fetch('/api/admin/outreach/verify', { method: 'POST' })
      setResult(await r.json())
    } catch {
      setResult({ ok: false, error: 'Could not reach the server' })
    } finally { setBusy(false) }
  }

  return <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
    <button className={styles.ghost} disabled={busy} type="button" onClick={run}>
      {busy ? 'Testing…' : 'Test the mail connection'}
    </button>
    {result && (result.ok
      ? <div className={styles.success}>Connected to {result.host} — sending as {result.from}. Nothing was emailed.</div>
      : <div className={styles.error}>{result.error}</div>)}
  </div>
}
