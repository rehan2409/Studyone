import React,{useState} from 'react'
import {useTable} from '../hooks/useTable'
import {Modal,Empty,PageLoader} from '../components/ui'
import SubjectInput from '../components/ui/SubjectInput'
import {Plus,Trash2,Edit3} from 'lucide-react'
import toast from 'react-hot-toast'
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const COLORS=['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ec4899','#ef4444','#06b6d4','#f97316']
const BLANK={subject:'',faculty:'',room:'',day:'Monday',time:'09:00',duration:60,color:'#3b82f6'}
export default function Timetable(){
  const {data,loading,insert,update,remove}=useTable('timetable',{orderBy:'time',ascending:true})
  const [modal,setModal]=useState(false),[editing,setEditing]=useState(null),[form,setForm]=useState(BLANK)
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const today=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
  const openNew=()=>{setEditing(null);setForm(BLANK);setModal(true)}
  const openEdit=s=>{setEditing(s.id);setForm({subject:s.subject,faculty:s.faculty||'',room:s.room||'',day:s.day,time:s.time,duration:s.duration,color:s.color});setModal(true)}
  const save=async()=>{
    if(!form.subject.trim()){toast.error('Subject required');return}
    try{if(editing){await update(editing,form);toast.success('Updated')}else{await insert(form);toast.success('Class added ✓')};setModal(false)}catch(e){toast.error(e.message)}
  }
  if(loading) return <PageLoader/>
  return(
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Timetable</h1><p style={{color:'#3d5a7a',fontSize:13}}>{data.length} classes</p></div>
        <button className="btn-primary" onClick={openNew}><Plus size={15}/>Add Class</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {DAYS.map(day=>{
          const slots=data.filter(s=>s.day===day).sort((a,b)=>a.time.localeCompare(b.time))
          const isToday=day===today
          return(
            <div key={day} className="card" style={{padding:16,borderColor:isToday?'rgba(37,99,235,0.3)':'rgba(255,255,255,0.07)',background:isToday?'rgba(37,99,235,0.04)':'rgba(13,18,30,0.95)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:14,color:isToday?'#60a5fa':'#64748b'}}>{day}</h3>
                {isToday&&<span className="badge" style={{fontSize:10,background:'rgba(37,99,235,0.12)',borderColor:'rgba(37,99,235,0.25)',color:'#93c5fd'}}>Today</span>}
                <span style={{fontSize:11,color:'#1e3a5f'}}>({slots.length} class{slots.length!==1?'es':''})</span>
              </div>
              {slots.length===0?<p style={{fontSize:12,color:'#1e3a5f',fontStyle:'italic'}}>No classes</p>:(
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {slots.map(s=>(
                    <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,background:'rgba(7,11,20,0.6)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'10px 14px'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)';e.currentTarget.querySelector('.sa').style.opacity='1'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.querySelector('.sa').style.opacity='0'}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:s.color,flexShrink:0}}/>
                      <div>
                        <p style={{fontSize:13,fontWeight:600,color:'#e2e8f0'}}>{s.subject}</p>
                        <p style={{fontSize:11,color:'#1e3a5f'}}>{s.time} · {s.room}</p>
                        {s.faculty&&<p style={{fontSize:10,color:'#1a2d45'}}>{s.faculty}</p>}
                      </div>
                      <div className="sa" style={{display:'flex',gap:2,opacity:0,transition:'opacity 0.15s'}}>
                        <button className="btn-icon" style={{padding:4}} onClick={()=>openEdit(s)}><Edit3 size={12}/></button>
                        <button className="btn-icon" style={{padding:4,color:'#f87171'}} onClick={async()=>{try{await remove(s.id);toast.success('Removed')}catch(e){toast.error(e.message)}}}><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit Class':'Add Class'}>
        <div style={{display:'flex',flexDirection:'column',gap:13}}>
          <div>
            <label className="label">Subject *</label>
            <SubjectInput value={form.subject} onChange={v=>setForm(p=>({...p,subject:v}))} placeholder="Type or select subject"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="label">Faculty</label><input className="input" placeholder="Prof. Sharma" value={form.faculty} onChange={set('faculty')}/></div>
            <div><label className="label">Room / Lab</label><input className="input" placeholder="A301" value={form.room} onChange={set('room')}/></div>
            <div><label className="label">Day</label><select className="input" value={form.day} onChange={set('day')}>{DAYS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="label">Time</label><input className="input" type="time" value={form.time} onChange={set('time')}/></div>
          </div>
          <div><label className="label">Duration (minutes)</label><input className="input" type="number" min="30" max="300" value={form.duration} onChange={set('duration')}/></div>
          <div>
            <label className="label">Color</label>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              {COLORS.map(c=><button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:24,height:24,borderRadius:'50%',background:c,border:form.color===c?'2px solid #fff':'2px solid transparent',outline:form.color===c?`2px solid ${c}`:'none',outlineOffset:2,cursor:'pointer'}}/>)}
            </div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editing?'Update':'Add Class'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
