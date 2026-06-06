import React,{useState} from 'react'
import {useTable} from '../hooks/useTable'
import {Modal,Empty,Badge,PageLoader} from '../components/ui'
import SubjectInput from '../components/ui/SubjectInput'
import {format,isBefore} from 'date-fns'
import {Plus,Trash2,Edit3,ClipboardList,AlertTriangle,CheckCircle,Clock} from 'lucide-react'
import toast from 'react-hot-toast'
const BLANK={title:'',subject:'',due_date:'',priority:'medium',status:'pending',description:''}
function alertInfo(due,status){
  if(status==='submitted') return{label:'Submitted',bg:'rgba(74,222,128,0.08)',bc:'rgba(74,222,128,0.2)',tc:'#86efac'}
  const h=(new Date(due)-Date.now())/3600000
  if(h<0)  return{label:'⚠ Overdue',    bg:'rgba(239,68,68,0.1)', bc:'rgba(239,68,68,0.2)', tc:'#fca5a5'}
  if(h<12) return{label:`🔴 ${Math.round(h)}h`,bg:'rgba(239,68,68,0.08)',bc:'rgba(239,68,68,0.18)',tc:'#fca5a5'}
  if(h<24) return{label:'🟡 <24h',      bg:'rgba(251,191,36,0.08)',bc:'rgba(251,191,36,0.18)',tc:'#fde68a'}
  return         {label:`🟢 ${format(new Date(due),'MMM d')}`,bg:'rgba(74,222,128,0.05)',bc:'rgba(74,222,128,0.12)',tc:'#86efac'}
}
export default function Assignments(){
  const {data,loading,insert,update,remove}=useTable('assignments',{orderBy:'due_date',ascending:true})
  const [filter,setFilter]=useState('all'),[modal,setModal]=useState(false),[editing,setEditing]=useState(null),[form,setForm]=useState(BLANK)
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const counts={pending:data.filter(a=>a.status==='pending').length,'in-progress':data.filter(a=>a.status==='in-progress').length,submitted:data.filter(a=>a.status==='submitted').length,overdue:data.filter(a=>a.status!=='submitted'&&isBefore(new Date(a.due_date),new Date())).length}
  const filtered=filter==='all'?data:filter==='overdue'?data.filter(a=>a.status!=='submitted'&&isBefore(new Date(a.due_date),new Date())):data.filter(a=>a.status===filter)
  const openNew=()=>{setEditing(null);setForm(BLANK);setModal(true)}
  const openEdit=a=>{setEditing(a.id);setForm({title:a.title,subject:a.subject||'',priority:a.priority,status:a.status,description:a.description||'',due_date:new Date(a.due_date).toISOString().slice(0,16)});setModal(true)}
  const save=async()=>{
    if(!form.title.trim()||!form.due_date){toast.error('Title and due date required');return}
    const d={...form,due_date:new Date(form.due_date).toISOString()}
    try{if(editing){await update(editing,d);toast.success('Updated')}else{await insert(d);toast.success('Task added ✓')};setModal(false)}catch(e){toast.error(e.message)}
  }
  if(loading) return <PageLoader/>
  return(
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Assignments</h1><p style={{color:'#3d5a7a',fontSize:13}}>{data.length} tasks</p></div>
        <button className="btn-primary" onClick={openNew}><Plus size={15}/>Add Task</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10,marginBottom:18}}>
        {[{k:'pending',l:'Pending',c:'#fbbf24'},{k:'in-progress',l:'In Progress',c:'#60a5fa'},{k:'submitted',l:'Submitted',c:'#4ade80'},{k:'overdue',l:'Overdue',c:'#f87171'}].map(s=>(
          <button key={s.k} onClick={()=>setFilter(filter===s.k?'all':s.k)} style={{padding:'13px 14px',borderRadius:13,border:`1px solid ${filter===s.k?s.c+'40':'rgba(255,255,255,0.06)'}`,background:filter===s.k?s.c+'10':'rgba(255,255,255,0.02)',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}>
            <p style={{fontSize:22,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:'#f1f5f9'}}>{counts[s.k]}</p>
            <p style={{fontSize:12,color:'#3d5a7a',marginTop:2}}>{s.l}</p>
          </button>
        ))}
      </div>
      <div style={{display:'flex',gap:7,marginBottom:14,flexWrap:'wrap'}}>
        {['all','pending','in-progress','submitted','overdue'].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:'6px 13px',borderRadius:8,border:'none',background:filter===f?'#2563eb':'rgba(255,255,255,0.04)',color:filter===f?'#fff':'#3d5a7a',cursor:'pointer',fontSize:12,fontWeight:600,textTransform:'capitalize'}}>{f}</button>)}
      </div>
      {filtered.length===0?<Empty icon={ClipboardList} title="No tasks" action={<button className="btn-primary" onClick={openNew}><Plus size={14}/>Add Task</button>}/>:
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          {filtered.map(a=>{const al=alertInfo(a.due_date,a.status);return(
            <div key={a.id} className="table-row" style={{borderColor:al.bc,background:al.bg}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                  <span style={{fontSize:14,fontWeight:600,color:'#e2e8f0'}}>{a.title}</span>
                  <Badge color={a.priority==='high'?'red':a.priority==='medium'?'yellow':'green'}>{a.priority}</Badge>
                </div>
                {a.subject&&<p style={{fontSize:12,color:'#1e3a5f',marginTop:2}}>{a.subject}</p>}
                {a.description&&<p style={{fontSize:11,color:'#1a2d45',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.description}</p>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
                <span className="badge" style={{fontSize:10,background:al.bg,borderColor:al.bc,color:al.tc}}>{al.label}</span>
                <select value={a.status} onChange={async e=>{try{await update(a.id,{status:e.target.value})}catch(err){toast.error(err.message)}}} style={{background:'rgba(7,11,20,0.9)',border:'1px solid rgba(255,255,255,0.07)',color:'#64748b',borderRadius:8,padding:'5px 8px',fontSize:12,cursor:'pointer'}}>
                  {['pending','in-progress','submitted','overdue'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn-icon" onClick={()=>openEdit(a)}><Edit3 size={13}/></button>
                <button className="btn-icon" style={{color:'#f87171'}} onClick={async()=>{try{await remove(a.id);toast.success('Deleted')}catch(e){toast.error(e.message)}}}><Trash2 size={13}/></button>
              </div>
            </div>
          )})}
        </div>
      }
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit Task':'New Task'}>
        <div style={{display:'flex',flexDirection:'column',gap:13}}>
          <div><label className="label">Title *</label><input className="input" placeholder="Task title" value={form.title} onChange={set('title')} autoFocus/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label className="label">Subject (type or select)</label>
              <SubjectInput value={form.subject} onChange={v=>setForm(p=>({...p,subject:v}))}/>
            </div>
            <div><label className="label">Priority</label><select className="input" value={form.priority} onChange={set('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <div><label className="label">Due Date & Time *</label><input className="input" type="datetime-local" value={form.due_date} onChange={set('due_date')}/></div>
          <div><label className="label">Status</label><select className="input" value={form.status} onChange={set('status')}>{['pending','in-progress','submitted','overdue'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="label">Description</label><textarea className="input" style={{minHeight:70,resize:'none'}} placeholder="Details…" value={form.description} onChange={set('description')}/></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)'}}><button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-primary" onClick={save}>{editing?'Update':'Add Task'}</button></div>
        </div>
      </Modal>
    </div>
  )
}
