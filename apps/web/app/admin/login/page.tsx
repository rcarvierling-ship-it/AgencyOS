'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RcvMark } from '../../components/RcvMark'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await response.json().catch(() => ({}))
      if (response.ok) router.replace('/admin')
      else { setError(data.error || 'That login was not accepted.'); setLoading(false) }
    } catch { setError('Unable to connect to AgencyOS.'); setLoading(false) }
  }

  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f6f6f3',color:'#20201e',fontFamily:'Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:24}}>
    <div style={{position:'fixed',inset:0,pointerEvents:'none',background:'radial-gradient(circle at 70% 20%,rgba(37,99,235,.08),transparent 28%),radial-gradient(circle at 25% 80%,rgba(124,58,237,.06),transparent 25%)'}} />
    <section style={{position:'relative',width:'100%',maxWidth:410}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:30,fontWeight:750,letterSpacing:'-.04em'}}><RcvMark size={30}/><span>RCV <small style={{fontSize:9,color:'#999',letterSpacing:'.12em',marginLeft:4}}>AGENCY</small></span></div>
      <div style={{background:'#fff',border:'1px solid #e4e4df',borderRadius:14,padding:30,boxShadow:'0 25px 70px rgba(30,30,40,.08)'}}>
        <div style={{fontSize:9,color:'#8d8d86',letterSpacing:'.12em',textTransform:'uppercase',fontWeight:650}}>Private workspace</div>
        <h1 style={{fontSize:30,lineHeight:1.05,letterSpacing:'-.055em',margin:'10px 0 9px'}}>Welcome to AgencyOS.</h1>
        <p style={{fontSize:12,lineHeight:1.55,color:'#73736d',margin:'0 0 25px'}}>Sign in with your individual AgencyOS account.</p>
        <form onSubmit={submit}>
          <label style={{display:'block',fontSize:10,fontWeight:650,marginBottom:7}}>Email</label>
          <input autoFocus type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" autoComplete="username" style={{width:'100%',height:44,border:'1px solid #dcdcd6',borderRadius:8,padding:'0 12px',fontSize:13,outline:'none',background:'#fafaf8'}} />
          <label style={{display:'block',fontSize:10,fontWeight:650,margin:'15px 0 7px'}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" style={{width:'100%',height:44,border:'1px solid #dcdcd6',borderRadius:8,padding:'0 12px',fontSize:13,outline:'none',background:'#fafaf8'}} />
          {error && <div style={{marginTop:9,fontSize:10,color:'#b42318'}}>{error}</div>}
          <button disabled={loading || !email || !password} style={{width:'100%',height:44,marginTop:15,border:0,borderRadius:8,background:loading||!email||!password?'#b8b8b3':'#20201e',color:'#fff',fontSize:11,fontWeight:650,cursor:loading?'wait':'pointer'}}>{loading?'Signing in…':'Enter AgencyOS →'}</button>
        </form>
      </div>
      <p style={{textAlign:'center',fontSize:9,color:'#9a9a94',marginTop:18}}>RCV Agency · Internal use only</p>
    </section>
  </main>
}
