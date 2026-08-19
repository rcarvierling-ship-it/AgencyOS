import Link from 'next/link'
import styles from './AdminShell.module.css'
import MobileNav, { type NavItem } from './MobileNav'
import { RcvMark } from '../components/RcvMark'
import { requireUser, type AdminRole } from '../../lib/admin-auth'
import { getAgencySettings } from '../../lib/settings'

export const adminNav = [
  ['Overview', '/admin', 'home'], ['Inquiries', '/admin/inquiries', 'envelope'], ['Discovery', '/admin/discovery', 'search'], ['Businesses', '/admin/businesses', 'building'], ['Contacts', '/admin/contacts', 'user-circle'], ['Pipeline', '/admin/pipeline', 'chart-bar'], ['Demos', '/admin/demos', 'desktop'], ['Outreach', '/admin/outreach', 'message'], ['Proposals', '/admin/proposals', 'file-alt'], ['Clients', '/admin/clients', 'users-alt'], ['Projects', '/admin/projects', 'folder'], ['Websites', '/admin/websites', 'globe'], ['Hosting', '/admin/hosting', 'server'], ['AI Operations', '/admin/ai', 'robot'], ['Analytics', '/admin/analytics', 'analytics'], ['Settings', '/admin/settings', 'setting'], ['Team & Access', '/admin/team', 'users-alt'], ['Your account', '/admin/account', 'user'],
] as const
function Icon({name,size=16}:{name:string;size?:number}){return <i aria-hidden="true" className={`uil uil-${name}`} style={{fontSize:size}}/>}
function RcvLogo({size=34}:{size?:number}){return <RcvMark size={size}/>}
const intelligence=new Set(['AI Operations','Analytics','Settings','Team & Access','Your account'])

export async function AdminShell({children,active='Overview',title,subtitle,action}:{children:React.ReactNode;active?:string;title?:string;subtitle?:string;action?:React.ReactNode}){
 const [user,settings]=await Promise.all([requireUser(),getAgencySettings()]);
 const canManageSettings=user.role==='owner'||user.role==='admin';
 const visibleNav=adminNav.filter(([name])=>name!=='Team & Access'||user.role==='owner').filter(([name])=>name!=='Settings'||canManageSettings)
 const profileHref='/admin/account'
 const initials=user.name.split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase()
 const mobileItems:NavItem[]=visibleNav.map(([name,href,icon])=>({name,href,icon,group:intelligence.has(name)?'intelligence':'workspace'}))
 return <div className={`${styles.app} agencyAdmin`}><MobileNav items={mobileItems} active={active} initials={initials} workspaceName={settings.agencyName}/><aside className={styles.sidebar}>
  <div className={styles.brand}><RcvLogo size={32}/><span>RCV <small>AGENCY</small></span></div>
  <div className={styles.workspace}><RcvLogo size={28}/><div><b>{settings.agencyName}</b><span>Command Center</span></div><Icon name="angle-down" size={12}/></div>
  <div className={styles.label}>Workspace</div><nav>{visibleNav.filter(([name])=>!intelligence.has(name)).map(([name,href,icon])=><Link className={name===active?styles.active:''} href={href} key={name}><span className={styles.navIcon}><Icon name={icon}/></span>{name}</Link>)}</nav>
  <div className={styles.label}>Intelligence</div><nav>{visibleNav.filter(([name])=>intelligence.has(name)).map(([name,href,icon])=><Link className={name===active?styles.active:''} href={href} key={name}><span className={styles.navIcon}><Icon name={icon}/></span>{name}</Link>)}</nav>
  <div className={styles.system}><em/>All systems operational</div>
 </aside><main className={styles.main}>
  <header className={styles.header}><div><div className={styles.eyebrow}>AgencyOS · Command Center</div>{title&&<h1>{title}</h1>}{subtitle&&<p>{subtitle}</p>}</div><div className={styles.headerRight}><form className={styles.search} action="/admin/businesses" method="get" role="search"><Icon name="search" size={13}/><input name="q" placeholder="Search businesses" aria-label="Search AgencyOS"/></form>{canManageSettings&&<Link className={styles.iconButton} href="/admin/settings" aria-label="Settings"><Icon name="setting" size={15}/></Link>}<Link className={styles.profile} href={profileHref} aria-label={`Signed in as ${user.name}`}>{initials}</Link></div></header>
  {action&&<div className={styles.actionRow}>{action}</div>}{children}
 </main></div>
}
export function Stat({label,value,delta,detail}:{label:string;value:string;delta?:string;detail?:string}){return <div className="stat"><span>{label}</span><strong>{value}</strong>{delta&&<small><Icon name="arrow-up-right" size={10}/> {delta} <i>{detail??'vs. last month'}</i></small>}</div>}
export function Card({title,eyebrow,children,href}:{title:string;eyebrow?:string;children:React.ReactNode;href?:string}){return <section className="card">{(eyebrow||title)&&<div className="cardHead"><div>{eyebrow&&<span className={styles.eyebrow}>{eyebrow}</span>}<h2>{title}</h2></div>{href&&<Link href={href}>View all <Icon name="arrow-right" size={11}/></Link>}</div>}{children}</section>}
export function Pill({children,tone='neutral'}:{children:React.ReactNode;tone?:'neutral'|'blue'|'green'|'purple'|'amber'|'red'}){return <span className={`pill ${tone}`}>{children}</span>}
export function EmptyState({title,body,href,label}:{title:string;body:string;href?:string;label?:string}){return <div className="empty"><div className="emptyIcon"><Icon name="sparkles" size={18}/></div><h3>{title}</h3><p>{body}</p>{href&&<Link className="primary" href={href}>{label??'Get started'} <Icon name="arrow-right" size={11}/></Link>}</div>}
export const roleLabels:Record<AdminRole,string>={owner:'Owner',admin:'Administrator',manager:'Manager',operator:'Operator',agent:'Agent',viewer:'Viewer'}
