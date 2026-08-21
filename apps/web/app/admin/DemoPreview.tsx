'use client'

import { useEffect, useState } from 'react'
import styles from './CrmForms.module.css'

const WIDTHS = [
  { key: 'desktop', label: 'Desktop', width: '100%', icon: 'desktop' },
  { key: 'tablet', label: 'Tablet', width: '834px', icon: 'tablet' },
  { key: 'phone', label: 'Phone', width: '390px', icon: 'mobile-android' },
] as const

/**
 * Shows the finished concept inside the admin. It renders in an iframe rather
 * than inline because the mockup ships its own document and stylesheet — the
 * admin's CSS must not leak into it, nor its into the admin.
 */
export function DemoPreview({ slug, businessName }: { slug: string; businessName: string }) {
  const [open, setOpen] = useState(false)
  const [device, setDevice] = useState<(typeof WIDTHS)[number]['key']>('desktop')
  const active = WIDTHS.find(w => w.key === device)!

  // Hold off the build-queue auto-refresh while someone is looking at a
  // concept — reloading the page out from under them loses their place.
  useEffect(() => {
    if (!open) return
    const body = document.body
    const count = Number(body.dataset.previewOpen ?? '0') + 1
    body.dataset.previewOpen = String(count)
    return () => {
      const remaining = Number(body.dataset.previewOpen ?? '1') - 1
      if (remaining > 0) body.dataset.previewOpen = String(remaining)
      else delete body.dataset.previewOpen
    }
  }, [open])

  if (!open) {
    return <button className={styles.ghost} style={{ height: 32, fontSize: 11 }} type="button" onClick={() => setOpen(true)}>
      Preview
    </button>
  }

  // flexBasis 100% makes the open panel take its own line in the wrapped row
  // rather than being squeezed into the actions column.
  // A fragment: the trigger stays inline in the row's action cluster while the
  // panel takes flex-basis 100% so it wraps onto its own full-width line.
  return <>
    <button className={styles.ghost} style={{ height: 32, fontSize: 11 }} type="button" onClick={() => setOpen(false)}>
      Hide
    </button>
    <div style={{ flexBasis: '100%', width: '100%', marginTop: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
      <b style={{ fontSize: 10 }}>{businessName}</b>
      <div style={{ display: 'flex', gap: 4 }}>
        {WIDTHS.map(w => <button key={w.key} type="button" onClick={() => setDevice(w.key)}
          className="filter"
          style={{ height: 28, fontSize: 8, cursor: 'pointer',
                   background: device === w.key ? '#20201e' : '#fff',
                   color: device === w.key ? '#fff' : '#666',
                   borderColor: device === w.key ? '#20201e' : undefined }}>
          {w.label}
        </button>)}
      </div>
      <a className="secondary" href={`/demo/${slug}`} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>Open full page ↗</a>
    </div>
    <div style={{ background: '#f1f1ee', border: '1px solid #e7e7e2', borderRadius: 10, padding: 12, display: 'grid', justifyItems: 'center' }}>
      <iframe
        src={`/demo/${slug}`}
        title={`Concept for ${businessName}`}
        loading="lazy"
        style={{ width: active.width, maxWidth: '100%', height: 620, border: '1px solid #e2e2dc', borderRadius: 8, background: '#fff' }}
      />
    </div>
    </div>
  </>
}
