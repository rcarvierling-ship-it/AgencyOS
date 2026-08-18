'use client'

import { FormEvent, useState } from 'react'
import styles from './ContactForm.module.css'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    const form = event.currentTarget
    const payload = Object.fromEntries(new FormData(form).entries())

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Unable to submit')
      form.reset()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className={styles.grid}>
        <label><span>Your name</span><input name="name" required autoComplete="name" placeholder="Jane Smith" /></label>
        <label><span>Business name</span><input name="business" required autoComplete="organization" placeholder="Smith Roofing" /></label>
        <label><span>Email</span><input name="email" required type="email" autoComplete="email" placeholder="jane@smithroofing.com" /></label>
        <label><span>Phone <em>optional</em></span><input name="phone" type="tel" autoComplete="tel" placeholder="(317) 555-0123" /></label>
        <label><span>Current website <em>optional</em></span><input name="currentWebsite" type="url" placeholder="https://yourbusiness.com" /></label>
        <label><span>What do you need?</span><select name="service" defaultValue="new-website"><option value="new-website">A new website</option><option value="redesign">Website redesign</option><option value="website-and-hosting">Website + hosting</option><option value="not-sure">Not sure yet</option></select></label>
      </div>
      <label><span>Tell us about the project</span><textarea name="message" required rows={5} placeholder="What does your business do, what would you like your website to accomplish, and what are you looking for?" /></label>
      <div className={styles.footer}>
        <p>We&apos;ll review your business and get back to you with next steps.</p>
        <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Start the conversation'} <span>↗</span></button>
      </div>
      {status === 'success' && <div className={styles.success}>Thanks — your project inquiry is in our system. We&apos;ll be in touch soon.</div>}
      {status === 'error' && <div className={styles.error}>Something went wrong. Please try again or email hello@rcvagency.com.</div>}
    </form>
  )
}
