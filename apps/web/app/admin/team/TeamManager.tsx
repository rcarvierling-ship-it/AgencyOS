'use client'

import { useState } from 'react'
import styles from './TeamManager.module.css'

const roles = [
  ['admin', 'Administrator', 'Full operational access; cannot change team roles.'],
  ['manager', 'Manager', 'Manage pipeline, clients, projects, and outreach.'],
  ['operator', 'Operator', 'Run day-to-day operations and pipeline work.'],
  ['agent', 'Agent', 'Designed for OpenClaw/automation accounts and operational work.'],
  ['viewer', 'Viewer', 'Read-only access to the agency workspace.'],
]
const ownerRole = ['owner', 'Owner', 'Primary account with full access and exclusive role-management authority.']
type User = { id:string; email:string; name:string; role:string; active:boolean; createdAt:string; lastLoginAt:string|null }

export function TeamManager({ initialUsers, currentUserId, timezone }:{initialUsers:User[];currentUserId:string;timezone:string}){
 const [users,setUsers]=useState(initialUsers),[form,setForm]=useState({name:'',email:'',password:'',role:'agent'}),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('')
 async function create(){setLoading(true);setMessage('');setError('');try{const response=await fetch('/api/admin/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to create user');setUsers(c=>[...c,data.user]);setForm({name:'',email:'',password:'',role:'agent'});setMessage(`Created ${data.user.email}`)}catch(e){setError(e instanceof Error?e.message:'Unable to create user')}finally{setLoading(false)}}
 async function patch(id:string,body:Record<string,unknown>){setError('');setMessage('');const response=await fetch('/api/admin/users',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,...body})});const data=await response.json();if(!response.ok){setError(data.error||'Unable to update user');return}setUsers(c=>c.map(u=>u.id===id?data.user:u));setMessage('User updated')}
 async function remove(id:string){if(!window.confirm('Delete this AgencyOS account? This also ends its active sessions.'))return;const response=await fetch('/api/admin/users',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id})});const data=await response.json();if(!response.ok){setError(data.error||'Unable to delete user');return}setUsers(c=>c.filter(u=>u.id!==id));setMessage('User deleted')}
 return <div className={styles.wrap}>
  <div className={styles.create}><div className={styles.createHead}><div><span className={styles.eyebrow}>New account</span><h3>Add a team member or agent</h3><p>Every account gets its own credentials and role. Passwords are never displayed again after creation.</p></div></div><div className={styles.form}>
   <label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="OpenClaw Agent"/></label><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="openclaw@rcvagency.com"/></label><label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="12+ characters"/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{roles.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className={styles.primary} disabled={loading||!form.name||!form.email||form.password.length<12} onClick={create}>{loading?'Creating…':'Create account'}</button>
  </div>{message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}</div>}</div>
  <div className={styles.table}><div className={styles.tableHead}><span>Member</span><span>Role</span><span>Status</span><span>Last login</span><span/></div>{users.map(user=><div className={styles.row} key={user.id}><div><b>{user.name}</b><small>{user.email}</small></div>{user.role==='owner'?<span className={styles.owner}>Owner</span>:<select className={styles.role} value={user.role} onChange={e=>patch(user.id,{role:e.target.value})}>{roles.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>}<button className={`${styles.status} ${user.active?styles.active:''}`} disabled={user.id===currentUserId} onClick={()=>patch(user.id,{active:!user.active})}>{user.active?'Active':'Disabled'}</button><span className={styles.last}>{user.lastLoginAt?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:timezone}).format(new Date(user.lastLoginAt)):'Never'}</span><button className={styles.delete} disabled={user.id===currentUserId||user.role==='owner'} onClick={()=>remove(user.id)}>Delete</button></div>)}</div>
  <div className={styles.roles}><span className={styles.eyebrow}>Role permissions</span><div className={styles.roleGrid}><div><b>{ownerRole[1]}</b><p>{ownerRole[2]}</p></div>{roles.map(([value,label,detail])=><div key={value}><b>{label}</b><p>{detail}</p></div>)}</div></div>
 </div>
}
