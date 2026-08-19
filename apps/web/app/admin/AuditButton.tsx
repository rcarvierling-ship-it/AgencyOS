'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './CrmForms.module.css'

export function AuditButton({ businessId, hasWebsite }: { businessId: string; hasWebsite: boolean }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setRunning(true); setError('')
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/audit`, { method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'The audit could not be completed')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The audit could not be completed')
    } finally {
      setRunning(false)
    }
  }

  return <div style={{ display: 'grid', gap: 8 }}>
    <button className={styles.primary} onClick={run} disabled={running} type="button">
      {running ? 'Auditing…' : hasWebsite ? 'Run website audit' : 'Score this opportunity'}
    </button>
    {error && <div className={styles.error}>{error}</div>}
  </div>
}
