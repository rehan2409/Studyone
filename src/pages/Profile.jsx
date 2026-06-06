import React,{useState} from 'react'
import {useAuth} from '../context/AuthContext'
import {Save,GraduationCap,Database,Wifi} from 'lucide-react'
import toast from 'react-hot-toast'
export default function Profile(){
  const {profile,updateProfile}=useAuth()
  const [form,setForm]=useState({name:profile?.name||'',college:profile?.college||'',branch:profile?.branch||'',year:profile?.year||'',cgpa:profile?.cgpa||''})
  const [saving,setSaving]=useState(false)
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const save=async()=>{setSaving(true);try{await updateProfile(form)}catch(e){toast.error(e.message)}finally{setSaving(false)}}
  const initials=(profile?.name||'S').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  return(
    <div style={{padding:24,maxWidth:600}}>
      <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9',marginBottom:22}}>Profile</h1>
      <div className="card" style={{padding:24}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:22,paddingBottom:22,borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{width:70,height:70,borderRadius:18,background:'linear-gradient(135deg,#2563eb,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:24,flexShrink:0,boxShadow:'0 8px 24px rgba(37,99,235,0.35)'}}>{initials}</div>
          <div>
            <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:20,color:'#f1f5f9'}}>{profile?.name}</h2>
            <p style={{color:'#3d5a7a',fontSize:13,marginTop:2}}>{profile?.email}</p>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
              <Wifi size={11} style={{color:'#4ade80'}}/>
              <p style={{fontSize:11,color:'#4ade80'}}>Synced to Supabase</p>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
          <div style={{gridColumn:'1/-1'}}><label className="label">Full Name</label><input className="input" value={form.name} onChange={set('name')}/></div>
          <div><label className="label">College</label><input className="input" placeholder="FAMT Mumbai" value={form.college} onChange={set('college')}/></div>
          <div><label className="label">Branch</label><input className="input" placeholder="IT / CS" value={form.branch} onChange={set('branch')}/></div>
          <div><label className="label">Year</label>
            <select className="input" value={form.year} onChange={set('year')}>
              <option value="">Select</option>
              {['First Year','Second Year','Third Year','Final Year'].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div><label className="label">CGPA</label><input className="input" placeholder="7.5" value={form.cgpa} onChange={set('cgpa')}/></div>
        </div>
        <button className="btn-primary" style={{marginTop:18,width:'100%',padding:'12px 0',fontSize:15}} onClick={save} disabled={saving}>
          <Save size={15}/>{saving?'Saving…':'Save Changes'}
        </button>
        <div style={{marginTop:18,padding:'13px 15px',borderRadius:12,background:'rgba(37,99,235,0.05)',border:'1px solid rgba(37,99,235,0.12)'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}><Database size={13} style={{color:'#3b82f6'}}/><p style={{fontSize:12,color:'#3b82f6',fontWeight:600}}>Data Storage</p></div>
          <p style={{fontSize:12,color:'#1e3a5f',lineHeight:1.6}}>All your data is permanently saved in Supabase cloud. Access it from any device by logging in.</p>
        </div>
      </div>
    </div>
  )
}
