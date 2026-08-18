import Link from 'next/link'
import styles from './AdminShell.module.css'

export const adminNav = [
  ['Overview', '/admin', 'home'],
  ['Businesses', '/admin/businesses', 'building'],
  ['Pipeline', '/admin/pipeline', 'chart-bar'],
  ['Demos', '/admin/demos', 'desktop'],
  ['Outreach', '/admin/outreach', 'message'],
  ['Clients', '/admin/clients', 'users-alt'],
  ['Projects', '/admin/projects', 'folder'],
  ['Websites', '/admin/websites', 'globe'],
  ['Hosting', '/admin/hosting', 'server'],
  ['AI Operations', '/admin/ai', 'robot'],
  ['Analytics', '/admin/analytics', 'analytics'],
  ['Settings', '/admin/settings', 'setting'],
] as const

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <i aria-hidden="true" className={`uil uil-${name}`} style={{ fontSize: size }} />
}

function RcvLogo({ size = 34 }: { size?: number }) {
  return <span className={styles.rcvLogo} style={{ width: size, height: size }} aria-hidden="true"><span>R</span></span>
}

export function AdminShell({ children, active = 'Overview', title, subtitle, action }: { children: React.ReactNode; active?: string; title?: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className={`${styles.app} agencyAdmin`}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><RcvLogo size={32} /><span>RCV <small>AGENCY</small></span></div>
      <div className={styles.workspace}><RcvLogo size={28} /><div><b>AgencyOS</b><span>Command Center</span></div><Icon name="angle-down" size={12} /></div>
      <div className={styles.label}>Workspace</div>
      <nav>{adminNav.slice(0, 9).map(([name, href, icon]) => <Link className={name === active ? styles.active : ''} href={href} key={name}><span className={styles.navIcon}><Icon name={icon} /></span>{name}</Link>)}</nav>
      <div className={styles.label}>Intelligence</div>
      <nav>{adminNav.slice(9).map(([name, href, icon]) => <Link className={name === active ? styles.active : ''} href={href} key={name}><span className={styles.navIcon}><Icon name={icon} /></span>{name}</Link>)}</nav>
      <div className={styles.system}><em />All systems operational</div>
    </aside>
    <main className={styles.main}>
      <header className={styles.header}><div><div className={styles.eyebrow}>AgencyOS · Command Center</div>{title && <h1>{title}</h1>}{subtitle && <p>{subtitle}</p>}</div><div className={styles.headerRight}><div className={styles.search}><Icon name="search" size={13} /> <span>Search AgencyOS</span></div><Link className={styles.iconButton} href="/admin/settings" aria-label="Settings"><Icon name="setting" size={15} /></Link><Link className={styles.profile} href="/admin/settings" aria-label="Open settings">RV</Link></div></header>
      {action && <div className={styles.actionRow}>{action}</div>}
      {children}
    </main>
  </div>
}

export function Stat({ label, value, delta, detail }: { label: string; value: string; delta?: string; detail?: string }) { return <div className="stat"><span>{label}</span><strong>{value}</strong>{delta && <small><Icon name="arrow-up-right" size={10} /> {delta} <i>{detail ?? 'vs. last month'}</i></small>}</div> }
export function Card({ title, eyebrow, children, href }: { title: string; eyebrow?: string; children: React.ReactNode; href?: string }) { return <section className="card">{(eyebrow || title) && <div className="cardHead"><div>{eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}<h2>{title}</h2></div>{href && <Link href={href}>View all <Icon name="arrow-right" size={11} /></Link>}</div>}{children}</section> }
export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral'|'blue'|'green'|'purple'|'amber' }) { return <span className={`pill ${tone}`}>{children}</span> }
export function EmptyState({ title, body, href, label }: { title: string; body: string; href?: string; label?: string }) { return <div className="empty"><div className="emptyIcon"><Icon name="sparkles" size={18} /></div><h3>{title}</h3><p>{body}</p>{href && <Link className="primary" href={href}>{label ?? 'Get started'} <Icon name="arrow-right" size={11} /></Link>}</div> }
