'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './CrmForms.module.css'

export function GenerateDemo({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/demo`, { method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'The concept could not be generated')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The concept could not be generated')
    } finally { setBusy(false) }
  }

  return <div style={{ display: 'grid', gap: 8 }}>
    <button className={styles.primary} onClick={run} disabled={busy} type="button">
      {busy ? 'Generating…' : 'Generate a concept'}
    </button>
    {error && <div className={styles.error}>{error}</div>}
  </div>
}

export function DemoReview({ demoId, status }: { demoId: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function set(next: string) {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/demos', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ demoId, status: next }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not update the concept')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the concept')
    } finally { setBusy(false) }
  }

  return <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
    {status !== 'approved' && <button className={styles.primary} style={{ height: 32, fontSize: 9 }} disabled={busy} onClick={() => set('approved')} type="button">Approve</button>}
    {status !== 'rejected' && <button className={styles.ghost} style={{ height: 32, fontSize: 9 }} disabled={busy} onClick={() => set('rejected')} type="button">Reject</button>}
    {status === 'rejected' && <button className={styles.ghost} style={{ height: 32, fontSize: 9 }} disabled={busy} onClick={() => set('ready')} type="button">Reopen</button>}
    {error && <span style={{ color: '#9a2424', fontSize: 9 }}>{error}</span>}
  </div>
}
