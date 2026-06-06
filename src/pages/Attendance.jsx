import React,{useState} from 'react'
import {useTable} from '../hooks/useTable'
import {Modal,Empty,PageLoader,ProgressRing} from '../components/ui'
import SubjectInput from '../components/ui/SubjectInput'
import {Plus,CheckCircle,XCircle,Trash2} from 'lucide-react'
import toast from 'react-hot-toast'
const advice=(p,t)=>{const pct=t>0?(p/t)*100:0;if(pct>=75){const b=Math.floor((p-.75*t)/.75);return b>0?`✅ Can skip ${b} more class${b>1?'es':''}`:'⚠️ Just at 75% limit'};const n=Math.ceil((.75*t-p)/.25);return `📚 Attend ${n} more to reach 75%`}
export default function Attendance(){
  const {data,loading,insert,update,remove}=useTable('attendance',{orderBy:'subject',ascending:true})
  const [modal,setModal]=useState(false),[form,setForm]=useState({subject:'',present:0,total:0})
  const avg=data.length?Math.round(data.reduce((s,a)=>s+(a.present/Math.max(a.total,1))*100,0)/data.length):0
  const save=async()=>{
    if(!form.subject.trim()){toast.error('Subject required');return}
    try{await insert({subject:form.subject,present:parseInt(form.present)||0,total:parseInt(form.total)||0});toast.success('Subject added ✓');setForm({subject:'',present:0,total:0});setModal(false)}catch(e){toast.error(e.message)}
  }
  const mark=async(a,present)=>{try{await update(a.id,{present:a.present+(present?1:0),total:a.total+1});toast.success(present?'Present ✓':'Absent marked')}catch(e){toast.error(e.message)}}
  if(loading) return <PageLoader/>
  return(
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Attendance Tracker</h1><p style={{color:'#3d5a7a',fontSize:13}}>Overall: {avg}%</p></div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={15}/>Add Subject</button>
      </div>
      <div className="card" style={{padding:20,marginBottom:20,display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
        <ProgressRing pct={avg} size={88} stroke={8} color={avg>=75?'#4ade80':avg>=65?'#fbbf24':'#f87171'}/>
        <div>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:34,color:avg>=75?'#4ade80':avg>=65?'#fbbf24':'#f87171'}}>{avg}%</p>
          <p style={{color:'#3d5a7a',fontSize:13}}>Overall Attendance</p>
          <p style={{fontSize:13,fontWeight:600,marginTop:4,color:avg>=75?'#4ade80':avg>=65?'#fbbf24':'#f87171'}}>{avg>=75?'Good standing ✅':avg>=65?'Warning ⚠️':'Critical 🚨'}</p>
        </div>
      </div>
      {data.length===0?<Empty icon={CheckCircle} title="No subjects added" action={<button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/>Add Subject</button>}/>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
          {data.map(a=>{
            const pct=a.total>0?Math.round((a.present/a.total)*100):0
            const color=pct>=75?'#4ade80':pct>=65?'#fbbf24':'#f87171'
            return(
              <div key={a.id} className="card" style={{padding:20,borderColor:`${color}20`,position:'relative'}}>
                <button className="btn-icon" style={{position:'absolute',top:10,right:10,padding:4,color:'#1e3a5f'}} onClick={async()=>{try{await remove(a.id)}catch(e){toast.error(e.message)}}}><Trash2 size={13}/></button>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <h3 style={{fontWeight:700,fontSize:15,color:'#f1f5f9',paddingRight:24}}>{a.subject}</h3>
                  <ProgressRing pct={pct} size={48} stroke={5} color={color}/>
                </div>
                <p style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:30,color,marginBottom:4}}>{pct}%</p>
                <div style={{height:5,background:'rgba(255,255,255,0.05)',borderRadius:3,marginBottom:8,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min(pct,100)}%`,background:color,borderRadius:3,transition:'width 0.7s ease'}}/>
                </div>
                <p style={{fontSize:12,color:'#1e3a5f',marginBottom:4}}>{a.present} / {a.total} classes</p>
                <p style={{fontSize:11,color:'#1a2d45',marginBottom:14,fontStyle:'italic'}}>{advice(a.present,a.total)}</p>
                <div style={{display:'flex',gap:7}}>
                  <button onClick={()=>mark(a,true)} style={{flex:1,padding:'8px 0',borderRadius:10,border:'1px solid rgba(74,222,128,0.25)',background:'rgba(74,222,128,0.08)',color:'#4ade80',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><CheckCircle size={13}/>Present</button>
                  <button onClick={()=>mark(a,false)} style={{flex:1,padding:'8px 0',borderRadius:10,border:'1px solid rgba(248,113,113,0.25)',background:'rgba(248,113,113,0.08)',color:'#f87171',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><XCircle size={13}/>Absent</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title="Add Subject" maxW={400}>
        <div style={{display:'flex',flexDirection:'column',gap:13}}>
          <div>
            <label className="label">Subject Name *</label>
            <SubjectInput value={form.subject} onChange={v=>setForm(p=>({...p,subject:v}))} placeholder="Type or select subject"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="label">Classes Attended</label><input className="input" type="number" min="0" value={form.present} onChange={e=>setForm(p=>({...p,present:e.target.value}))}/></div>
            <div><label className="label">Total Classes</label><input className="input" type="number" min="0" value={form.total} onChange={e=>setForm(p=>({...p,total:e.target.value}))}/></div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Add Subject</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
