'use client'

import { FormEvent, useState } from 'react'
import styles from './Account.module.css'

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving'>('idle')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const tooShort = newPassword.length > 0 && newPassword.length < 12
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const ready = currentPassword.length > 0 && newPassword.length >= 12 && newPassword === confirmPassword

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!ready || status === 'saving') return
    setStatus('saving'); setError(''); setMessage('')
    try {
      const response = await fetch('/api/admin/account/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to change password')
      setMessage('Password updated. Your other sessions have been signed out.')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to change password')
    } finally {
      setStatus('idle')
    }
  }

  return <form className={styles.form} onSubmit={submit}>
    <label className={styles.field}>
      <span>Current password</span>
      <input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
    </label>
    <div className={styles.pair}>
      <label className={styles.field}>
        <span>New password</span>
        <input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <small className={tooShort ? styles.warn : undefined}>At least 12 characters.</small>
      </label>
      <label className={styles.field}>
        <span>Confirm new password</span>
        <input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        {mismatch && <small className={styles.warn}>Passwords do not match.</small>}
      </label>
    </div>
    {error && <div className={styles.error}>{error}</div>}
    {message && <div className={styles.success}>{message}</div>}
    <div className={styles.actions}>
      <button className={styles.primary} disabled={!ready || status === 'saving'}>
        {status === 'saving' ? 'Updating…' : 'Update password'}
      </button>
    </div>
  </form>
}

export function SignOut() {
  return <form action="/api/admin/logout" method="post">
    <button className={styles.signOut} type="submit">Sign out of AgencyOS</button>
  </form>
}
