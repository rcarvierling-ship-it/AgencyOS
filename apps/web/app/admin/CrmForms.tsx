'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './CrmForms.module.css'
import { ACTIVITY_TYPES } from '../../lib/crm-constants'

type Values = Record<string, string>

function useSubmit(onDone: () => void) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function send(url: string, method: 'POST' | 'PATCH', body: unknown, successText: string) {
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Something went wrong')
      setMessage(successText)
      onDone()
      return data
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
      return null
    } finally {
      setSaving(false)
    }
  }
  return { saving, error, message, send, setMessage }
}

function Field({ label, name, values, set, ...rest }: {
  label: string; name: string; values: Values; set: (n: string, v: string) => void
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className={styles.field}>{label}
    <input name={name} value={values[name] ?? ''} onChange={e => set(name, e.target.value)} {...rest} />
  </label>
}

const BLANK: Values = { name:'', industry:'', websiteUrl:'', phone:'', email:'', address:'', city:'', state:'', postalCode:'', opportunityScore:'', notes:'' }

export function BusinessForm({ business }: { business?: Values & { id: string; slug: string } }) {
  const router = useRouter()
  const [values, setValues] = useState<Values>({ ...BLANK, ...(business ?? {}) })
  const set = (n: string, v: string) => setValues(c => ({ ...c, [n]: v }))
  const { saving, error, message, send } = useSubmit(() => router.refresh())
  const editing = Boolean(business)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const data = editing
      ? await send(`/api/admin/businesses/${business!.id}`, 'PATCH', values, 'Saved.')
      : await send('/api/admin/businesses', 'POST', values, 'Business created.')
    if (data?.business && !editing) router.push(`/admin/businesses/${data.business.slug}`)
  }

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.grid}>
      <Field label="Business name" name="name" values={values} set={set} required placeholder="Bell Electric" />
      <Field label="Industry" name="industry" values={values} set={set} placeholder="Electrical" />
      <Field label="Website" name="websiteUrl" values={values} set={set} placeholder="bellelectric.com" />
      <Field label="Phone" name="phone" values={values} set={set} placeholder="(502) 555-0177" />
      <Field label="Email" name="email" values={values} set={set} type="email" placeholder="office@bellelectric.com" />
      <Field label="Opportunity score" name="opportunityScore" values={values} set={set} type="number" min={0} max={100} placeholder="0–100" />
    </div>
    <Field label="Address" name="address" values={values} set={set} placeholder="118 W Main St" />
    <div className={styles.grid3}>
      <Field label="City" name="city" values={values} set={set} placeholder="Louisville" />
      <Field label="State" name="state" values={values} set={set} placeholder="KY" />
      <Field label="ZIP" name="postalCode" values={values} set={set} placeholder="40202" />
    </div>
    <label className={styles.field}>Notes
      <textarea name="notes" value={values.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="What you know about this business so far." />
    </label>
    {error && <div className={styles.error}>{error}</div>}
    {message && <div className={styles.success}>{message}</div>}
    <div className={styles.row}>
      <button className={styles.primary} disabled={saving || !values.name}>
        {saving ? 'Saving…' : editing ? 'Save changes' : 'Create business'}
      </button>
      <Link className={styles.ghost} href={editing ? `/admin/businesses/${business!.slug}` : '/admin/businesses'}>Cancel</Link>
    </div>
  </form>
}

export function ContactForm({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [values, setValues] = useState<Values>({ name:'', role:'', email:'', phone:'' })
  const set = (n: string, v: string) => setValues(c => ({ ...c, [n]: v }))
  const { saving, error, message, send } = useSubmit(() => router.refresh())

  async function submit(event: FormEvent) {
    event.preventDefault()
    const data = await send(`/api/admin/businesses/${businessId}/contacts`, 'POST', values, 'Contact added.')
    if (data) setValues({ name:'', role:'', email:'', phone:'' })
  }

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.grid}>
      <Field label="Name" name="name" values={values} set={set} required placeholder="Marcus Bell" />
      <Field label="Role" name="role" values={values} set={set} placeholder="Owner" />
      <Field label="Email" name="email" values={values} set={set} type="email" placeholder="marcus@bellelectric.com" />
      <Field label="Phone" name="phone" values={values} set={set} placeholder="(502) 555-0177" />
    </div>
    {error && <div className={styles.error}>{error}</div>}
    {message && <div className={styles.success}>{message}</div>}
    <div className={styles.row}><button className={styles.primary} disabled={saving || !values.name}>{saving ? 'Adding…' : 'Add contact'}</button></div>
  </form>
}

export function ActivityForm({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [values, setValues] = useState<Values>({ type:'note', title:'', detail:'' })
  const set = (n: string, v: string) => setValues(c => ({ ...c, [n]: v }))
  const { saving, error, message, send } = useSubmit(() => router.refresh())

  async function submit(event: FormEvent) {
    event.preventDefault()
    const data = await send(`/api/admin/businesses/${businessId}/activities`, 'POST', values, 'Logged.')
    if (data) setValues({ type: values.type, title:'', detail:'' })
  }

  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.grid}>
      <label className={styles.field}>Type
        <select value={values.type} onChange={e => set('type', e.target.value)}>
          {ACTIVITY_TYPES.map(type => <option key={type} value={type}>{type.replace('_', ' ').replace(/^./, c => c.toUpperCase())}</option>)}
        </select>
      </label>
      <Field label="What happened" name="title" values={values} set={set} required placeholder="Left a voicemail" />
    </div>
    <label className={styles.field}>Detail <span className={styles.hint}>optional</span>
      <textarea value={values.detail} onChange={e => set('detail', e.target.value)} placeholder="Anything worth remembering next time." />
    </label>
    {error && <div className={styles.error}>{error}</div>}
    {message && <div className={styles.success}>{message}</div>}
    <div className={styles.row}><button className={styles.primary} disabled={saving || !values.title}>{saving ? 'Saving…' : 'Log activity'}</button></div>
  </form>
}
