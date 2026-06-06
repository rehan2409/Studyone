import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, register, user } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name:'', email:'', password:'', college:'', branch:'', year:'', cgpa:'' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  if (user) { nav('/dashboard'); return null }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Fill required fields'); return }
    if (form.password.length < 6) { toast.error('Password min 6 characters'); return }
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back! 👋')
      } else {
        if (!form.name) { toast.error('Enter your name'); setLoading(false); return }
        await register(form)
        toast.success('Account created! Welcome 🎓')
      }
      nav('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#070b14', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' }}>
      {/* Background glow */}
      <div style={{ position:'absolute', top:'20%', left:'30%', width:500, height:500, background:'rgba(37,99,235,0.06)', borderRadius:'50%', filter:'blur(100px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'20%', right:'25%', width:400, height:400, background:'rgba(124,58,237,0.06)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:68, height:68, borderRadius:20, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 8px 32px rgba(37,99,235,0.35)' }}>
            <GraduationCap size={32} color="#fff"/>
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:30, color:'#f1f5f9' }}>
            Study<span className="grad-text">One</span>
          </h1>
          <p style={{ color:'#3d5a7a', fontSize:14, marginTop:5 }}>Student productivity & collaboration platform</p>
        </div>

        <div className="card" style={{ padding:'28px 28px' }}>
          {/* Tabs */}
          <div style={{ display:'flex', background:'rgba(7,11,20,0.8)', borderRadius:12, padding:4, marginBottom:24, gap:4 }}>
            {['login','register'].map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1, padding:'9px 0', borderRadius:9, border:'none', cursor:'pointer',
                fontWeight:600, fontSize:13, fontFamily:'Inter,sans-serif',
                background: tab===t ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'transparent',
                color: tab===t ? '#fff' : '#3d5a7a', transition:'all 0.2s',
                boxShadow: tab===t ? '0 2px 12px rgba(37,99,235,0.35)' : 'none'
              }}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {tab === 'register' && (
              <div>
                <label className="label">Full Name *</label>
                <div style={{ position:'relative' }}>
                  <User size={14} style={{ position:'absolute', left:12, top:12, color:'#1e3a5f' }}/>
                  <input className="input" style={{ paddingLeft:36 }} placeholder="Rehan Dhamaskar" value={form.name} onChange={set('name')}/>
                </div>
              </div>
            )}
            <div>
              <label className="label">Email *</label>
              <div style={{ position:'relative' }}>
                <Mail size={14} style={{ position:'absolute', left:12, top:12, color:'#1e3a5f' }}/>
                <input className="input" style={{ paddingLeft:36 }} type="email" placeholder="you@college.edu" value={form.email} onChange={set('email')} autoFocus={tab==='login'}/>
              </div>
            </div>
            <div>
              <label className="label">Password *</label>
              <div style={{ position:'relative' }}>
                <Lock size={14} style={{ position:'absolute', left:12, top:12, color:'#1e3a5f' }}/>
                <input className="input" style={{ paddingLeft:36, paddingRight:40 }} type={show?'text':'password'} placeholder="min 6 characters" value={form.password} onChange={set('password')}/>
                <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:12, top:11, background:'none', border:'none', cursor:'pointer', color:'#1e3a5f' }}>
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            {tab === 'register' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label className="label">College</label><input className="input" placeholder="FAMT Mumbai" value={form.college} onChange={set('college')}/></div>
                <div><label className="label">Branch</label><input className="input" placeholder="IT / CS" value={form.branch} onChange={set('branch')}/></div>
                <div>
                  <label className="label">Year</label>
                  <select className="input" value={form.year} onChange={set('year')}>
                    <option value="">Select</option>
                    {['First Year','Second Year','Third Year','Final Year'].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div><label className="label">CGPA</label><input className="input" placeholder="7.5" value={form.cgpa} onChange={set('cgpa')}/></div>
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width:'100%', padding:'12px 0', fontSize:15, marginTop:4 }} disabled={loading}>
              {loading ? <Loader2 size={18} style={{ animation:'spin 0.8s linear infinite' }}/> : <>
                {tab==='login'?'Sign In':'Create Account'} <ArrowRight size={16}/>
              </>}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', color:'#1a2d45', fontSize:11, marginTop:14 }}>
          Powered by Supabase · Real-time sync across devices
        </p>
      </div>
    </div>
  )
}
