import Link from 'next/link'
import styles from './AdminShell.module.css'

export const adminNav = [
  ['Overview', '/admin', '⌂'],
  ['Businesses', '/admin/businesses', '◫'],
  ['Pipeline', '/admin/pipeline', '◈'],
  ['Demos', '/admin/demos', '◇'],
  ['Outreach', '/admin/outreach', '↗'],
  ['Clients', '/admin/clients', '♙'],
  ['Projects', '/admin/projects', '□'],
  ['Websites', '/admin/websites', '▣'],
  ['Hosting', '/admin/hosting', '◌'],
  ['AI Operations', '/admin/ai', '✦'],
  ['Analytics', '/admin/analytics', '◒'],
  ['Settings', '/admin/settings', '⚙'],
] as const

export function AdminShell({ children, active = 'Overview', title, subtitle, action }: { children: React.ReactNode; active?: string; title?: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.mark}>R</span><span>RCV <small>AGENCY</small></span></div>
        <div className={styles.workspace}><span className={styles.avatar}>RV</span><div><b>AgencyOS</b><span>Command Center</span></div><i>⌄</i></div>
        <div className={styles.label}>Workspace</div>
        <nav>{adminNav.slice(0, 9).map(([name, href, icon]) => <Link className={name === active ? styles.active : ''} href={href} key={name}><span>{icon}</span>{name}</Link>)}</nav>
        <div className={styles.label}>Intelligence</div>
        <nav>{adminNav.slice(9).map(([name, href, icon]) => <Link className={name === active ? styles.active : ''} href={href} key={name}><span>{icon}</span>{name}</Link>)}</nav>
        <div className={styles.system}><em />All systems operational</div>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <div><div className={styles.eyebrow}>AgencyOS · Command Center</div>{title && <h1>{title}</h1>}{subtitle && <p>{subtitle}</p>}</div>
          <div className={styles.headerRight}><div className={styles.search}>⌕&nbsp; Search AgencyOS</div><Link className={styles.iconButton} href="/admin/settings">◐</Link><Link className={styles.profile} href="/admin/settings">RV</Link></div>
        </header>
        {action && <div className={styles.actionRow}>{action}</div>}
        {children}
      </main>
    </div>
  )
}

export function Stat({ label, value, delta, detail }: { label: string; value: string; delta?: string; detail?: string }) {
  return <div className={styles.stat}><span>{label}</span><strong>{value}</strong>{delta && <small>↗ {delta} <i>{detail ?? 'vs. last month'}</i></small>}</div>
}

export function Card({ title, eyebrow, children, href }: { title: string; eyebrow?: string; children: React.ReactNode; href?: string }) {
  return <section className={styles.card}>{(eyebrow || title) && <div className={styles.cardHead}><div>{eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}<h2>{title}</h2></div>{href && <Link href={href}>View all →</Link>}</div>}{children}</section>
}

export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral'|'blue'|'green'|'purple'|'amber' }) { return <span className={`${styles.pill} ${styles[tone]}`}>{children}</span> }

export function EmptyState({ title, body, href, label }: { title: string; body: string; href?: string; label?: string }) { return <div className={styles.empty}><div className={styles.emptyIcon}>✦</div><h3>{title}</h3><p>{body}</p>{href && <Link className={styles.primary} href={href}>{label ?? 'Get started'} →</Link>}</div> }
