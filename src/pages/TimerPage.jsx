import React,{useState,useEffect,useRef} from 'react'
import {useAuth} from '../context/AuthContext'
import {supabase} from '../lib/supabase'
import {useTable} from '../hooks/useTable'
import {Play,Pause,RotateCcw,Coffee,BookOpen} from 'lucide-react'
import {format} from 'date-fns'
import toast from 'react-hot-toast'
const MODES=[{id:'focus',label:'Focus',mins:25,color:'#2563eb'},{id:'short',label:'Short Break',mins:5,color:'#10b981'},{id:'long',label:'Long Break',mins:15,color:'#7c3aed'}]
export default function TimerPage(){
  const {user}=useAuth()
  const {data:sessions,refetch}=useTable('timer_sessions')
  const [mode,setMode]=useState('focus'),[secs,setSecs]=useState(25*60),[running,setRunning]=useState(false),[count,setCount]=useState(0)
  const ref=useRef(null),m=MODES.find(x=>x.id===mode)
  useEffect(()=>{setSecs(m.mins*60);setRunning(false);clearInterval(ref.current)},[mode])
  useEffect(()=>{
    if(running){ref.current=setInterval(()=>setSecs(s=>{if(s<=1){clearInterval(ref.current);setRunning(false);if(mode==='focus'){setCount(c=>c+1);supabase.from('timer_sessions').insert({user_id:user.id,mode:'focus',duration:m.mins}).then(()=>refetch());toast.success('Session done! 🎉 Take a break.')}return 0}return s-1}),1000)}
    else clearInterval(ref.current)
    return()=>clearInterval(ref.current)
  },[running])
  const reset=()=>{clearInterval(ref.current);setRunning(false);setSecs(m.mins*60)}
  const mins=Math.floor(secs/60).toString().padStart(2,'0'),sec2=(secs%60).toString().padStart(2,'0')
  const pct=1-secs/(m.mins*60),circ=2*Math.PI*100
  const totalMins=sessions.reduce((s,x)=>s+(x.duration||0),0)
  return(
    <div style={{padding:24}}>
      <div style={{marginBottom:20}}><h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Study Timer</h1><p style={{color:'#3d5a7a',fontSize:13}}>Pomodoro technique for deep focus</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:28}}>
        {[{l:'Total Sessions',v:sessions.filter(s=>s.mode==='focus').length,c:'#2563eb'},{l:'Study Hours',v:(totalMins/60).toFixed(1)+'h',c:'#fb923c'},{l:"Today's Pomodoros",v:count,c:'#7c3aed'}].map(x=>(
          <div key={x.l} className="card" style={{padding:18,textAlign:'center',borderColor:`${x.c}20`,background:`${x.c}07`}}>
            <p style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:26,color:x.c}}>{x.v}</p>
            <p style={{fontSize:12,color:'#3d5a7a',marginTop:2}}>{x.l}</p>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:28}}>
        {MODES.map(mo=><button key={mo.id} onClick={()=>setMode(mo.id)} style={{padding:'9px 20px',borderRadius:12,border:'none',cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'Inter,sans-serif',background:mode===mo.id?mo.color:'rgba(255,255,255,0.04)',color:mode===mo.id?'#fff':'#3d5a7a',transition:'all 0.2s',boxShadow:mode===mo.id?`0 4px 20px ${mo.color}40`:''}}>{mo.label}</button>)}
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:28}}>
        <div style={{position:'relative',width:220,height:220}}>
          <svg style={{width:'100%',height:'100%',transform:'rotate(-90deg)'}} viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10"/>
            <circle cx="120" cy="120" r="100" fill="none" stroke={m.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} style={{transition:'stroke-dashoffset 1s linear'}}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontFamily:'monospace',fontSize:46,fontWeight:700,color:'#f1f5f9',letterSpacing:2}}>{mins}:{sec2}</span>
            <span style={{color:'#3d5a7a',fontSize:13,marginTop:4}}>{m.label}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:12,marginTop:20}}>
          <button className="btn-secondary" style={{padding:'10px 14px',borderRadius:12}} onClick={reset}><RotateCcw size={18}/></button>
          <button onClick={()=>setRunning(!running)} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 32px',borderRadius:12,border:'none',cursor:'pointer',fontWeight:700,fontSize:15,color:'#fff',background:m.color,boxShadow:`0 4px 20px ${m.color}40`,fontFamily:'Inter,sans-serif'}}>
            {running?<><Pause size={20}/>Pause</>:<><Play size={20}/>{secs===m.mins*60?'Start':'Resume'}</>}
          </button>
        </div>
      </div>
      {sessions.length>0&&(
        <div className="card" style={{padding:20}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>Recent Sessions</h3>
          <div style={{display:'flex',flexDirection:'column',gap:7,maxHeight:200,overflowY:'auto'}}>
            {[...sessions].slice(0,10).map(s=>(
              <div key={s.id} className="table-row">
                <span style={{width:7,height:7,borderRadius:'50%',background:'#2563eb',flexShrink:0}}/>
                <span style={{flex:1,fontSize:13,color:'#64748b'}}>{s.mode==='focus'?'Focus Session':'Break'}</span>
                <span style={{fontSize:13,fontWeight:600,color:'#60a5fa'}}>{s.duration} min</span>
                <span style={{fontSize:11,color:'#1e3a5f'}}>{format(new Date(s.created_at),'MMM d, h:mm a')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
