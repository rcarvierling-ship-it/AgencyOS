'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminShell.module.css'
import { RcvMark } from '../components/RcvMark'

export type NavItem = { name: string; href: string; icon: string; group: 'workspace' | 'intelligence' }

export default function MobileNav({ items, active, initials, workspaceName }: {
  items: NavItem[]
  active: string
  initials: string
  workspaceName: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on navigation. The drawer is client-side, so a Link click would
  // otherwise leave it open over the page it just navigated to.
  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const groups = [
    ['Workspace', items.filter(item => item.group === 'workspace')],
    ['Intelligence', items.filter(item => item.group === 'intelligence')],
  ] as const

  return <>
    <div className={styles.mobileBar}>
      <button
        type="button"
        className={styles.mobileButton}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="admin-mobile-drawer"
        onClick={() => setOpen(true)}
      >
        <i aria-hidden="true" className="uil uil-bars" />
      </button>
      <Link className={styles.mobileBrand} href="/admin">
        <RcvMark size={26} />
        <span>RCV <small>AGENCY</small></span>
      </Link>
      <Link className={styles.mobileProfile} href="/admin" aria-label="Your account">{initials}</Link>
    </div>

    <div
      className={`${styles.mobileScrim} ${open ? styles.mobileScrimOpen : ''}`}
      onClick={() => setOpen(false)}
      aria-hidden="true"
    />

    <aside
      id="admin-mobile-drawer"
      className={`${styles.mobileDrawer} ${open ? styles.mobileDrawerOpen : ''}`}
      aria-label="AgencyOS navigation"
      aria-hidden={!open}
    >
      <div className={styles.mobileDrawerHead}>
        <div className={styles.brand}>
          <RcvMark size={28} />
          <span>RCV <small>AGENCY</small></span>
        </div>
        <button type="button" className={styles.mobileButton} aria-label="Close navigation" onClick={() => setOpen(false)}>
          <i aria-hidden="true" className="uil uil-times" />
        </button>
      </div>

      <div className={styles.workspace}>
        <RcvMark size={26} />
        <div><b>{workspaceName}</b><span>Command Center</span></div>
      </div>

      {groups.map(([label, groupItems]) => groupItems.length ? <div key={label}>
        <div className={styles.label}>{label}</div>
        <nav>{groupItems.map(item => <Link
          className={item.name === active ? styles.active : ''}
          href={item.href}
          key={item.name}
          aria-current={item.name === active ? 'page' : undefined}
        >
          <span className={styles.navIcon}><i aria-hidden="true" className={`uil uil-${item.icon}`} /></span>{item.name}
        </Link>)}</nav>
      </div> : null)}

      <div className={styles.system}><em />All systems operational</div>
    </aside>
  </>
}
