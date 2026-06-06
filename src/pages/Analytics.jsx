import React from 'react'
import {useTable} from '../hooks/useTable'
import {PageLoader} from '../components/ui'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,LineChart,Line,PieChart,Pie,Cell} from 'recharts'
import {format,subDays} from 'date-fns'
const T={contentStyle:{background:'#0d1220',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,fontSize:12},cursor:{fill:'rgba(255,255,255,0.02)'}}
export default function Analytics(){
  const {data:notes,      loading:l1}=useTable('notes')
  const {data:assignments,loading:l2}=useTable('assignments')
  const {data:expenses,   loading:l3}=useTable('expenses')
  const {data:sessions,   loading:l4}=useTable('timer_sessions')
  const {data:attendance, loading:l5}=useTable('attendance')
  if(l1||l2||l3||l4||l5) return <PageLoader/>
  const income=expenses.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0)
  const spent=expenses.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0)
  const totalMins=sessions.reduce((s,x)=>s+(x.duration||0),0)
  const avgAtt=attendance.length?Math.round(attendance.reduce((s,a)=>s+(a.present/Math.max(a.total,1))*100,0)/attendance.length):0
  const studyData=Array.from({length:7},(_,i)=>{const d=subDays(new Date(),6-i),ds=format(d,'yyyy-MM-dd');return{day:format(d,'EEE'),hours:+(sessions.filter(s=>format(new Date(s.created_at),'yyyy-MM-dd')===ds).reduce((s,x)=>s+(x.duration||0),0)/60).toFixed(1)}})
  const asgPie=[{name:'Pending',value:assignments.filter(a=>a.status==='pending').length,fill:'#fbbf24'},{name:'In Progress',value:assignments.filter(a=>a.status==='in-progress').length,fill:'#60a5fa'},{name:'Submitted',value:assignments.filter(a=>a.status==='submitted').length,fill:'#4ade80'},{name:'Overdue',value:assignments.filter(a=>a.status==='overdue').length,fill:'#f87171'}].filter(x=>x.value>0)
  const attData=attendance.map(a=>({name:a.subject.length>10?a.subject.slice(0,10)+'…':a.subject,pct:a.total>0?Math.round((a.present/a.total)*100):0}))
  const expData=Array.from({length:7},(_,i)=>{const d=subDays(new Date(),6-i),ds=format(d,'yyyy-MM-dd');return{day:format(d,'EEE'),income:expenses.filter(e=>e.type==='income'&&format(new Date(e.date),'yyyy-MM-dd')===ds).reduce((s,e)=>s+e.amount,0),expense:expenses.filter(e=>e.type==='expense'&&format(new Date(e.date),'yyyy-MM-dd')===ds).reduce((s,e)=>s+e.amount,0)}})
  const STATS=[{l:'Notes Created',v:notes.length,c:'#60a5fa'},{l:'Study Hours',v:(totalMins/60).toFixed(1)+'h',c:'#fb923c'},{l:'Avg Attendance',v:avgAtt+'%',c:avgAtt>=75?'#4ade80':'#f87171'},{l:'Balance',v:'₹'+(income-spent).toLocaleString('en-IN'),c:income>=spent?'#4ade80':'#f87171'}]
  return(
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:18}}>
      <div><h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Analytics</h1><p style={{color:'#3d5a7a',fontSize:13}}>Your productivity overview</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
        {STATS.map(s=><div key={s.l} className="card" style={{padding:18,borderColor:`${s.c}18`,background:`${s.c}06`}}><p style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:26,color:s.c}}>{s.v}</p><p style={{fontSize:13,color:'#3d5a7a',marginTop:2}}>{s.l}</p></div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>Study Hours (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={160}><BarChart data={studyData} barSize={20}><XAxis dataKey="day" tick={{fill:'#1e3a5f',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#1e3a5f',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v+'h'}/><Tooltip {...T} formatter={v=>[v+'h','Study']}/><Bar dataKey="hours" fill="#2563eb" radius={[6,6,0,0]} opacity={0.9}/></BarChart></ResponsiveContainer>
        </div>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>Assignment Status</h3>
          {asgPie.length===0?<p style={{color:'#1e3a5f',fontSize:13,textAlign:'center',padding:'28px 0'}}>No assignments</p>:(
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <ResponsiveContainer width={130} height={130}><PieChart><Pie data={asgPie} cx="50%" cy="50%" innerRadius={34} outerRadius={60} dataKey="value" paddingAngle={3}>{asgPie.map(e=><Cell key={e.name} fill={e.fill}/>)}</Pie></PieChart></ResponsiveContainer>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:7}}>{asgPie.map(d=><div key={d.name} style={{display:'flex',justifyContent:'space-between',fontSize:12}}><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:7,height:7,borderRadius:'50%',background:d.fill}}/><span style={{color:'#64748b'}}>{d.name}</span></div><span style={{color:'#f1f5f9',fontWeight:700}}>{d.value}</span></div>)}</div>
            </div>
          )}
        </div>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>Attendance by Subject</h3>
          {attData.length===0?<p style={{color:'#1e3a5f',fontSize:13,textAlign:'center',padding:'28px 0'}}>No data</p>:(
            <ResponsiveContainer width="100%" height={160}><BarChart data={attData} barSize={18} layout="vertical"><XAxis type="number" domain={[0,100]} tick={{fill:'#1e3a5f',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v+'%'}/><YAxis type="category" dataKey="name" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} width={72}/><Tooltip {...T} formatter={v=>[v+'%','Attendance']}/><Bar dataKey="pct" fill="#2563eb" radius={[0,6,6,0]} background={{fill:'rgba(255,255,255,0.02)',radius:[0,6,6,0]}}/></BarChart></ResponsiveContainer>
          )}
        </div>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>Expense Trend</h3>
          <ResponsiveContainer width="100%" height={160}><LineChart data={expData}><XAxis dataKey="day" tick={{fill:'#1e3a5f',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#1e3a5f',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>'₹'+v}/><Tooltip {...T} formatter={(v,n)=>['₹'+v,n]}/><Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2.5} dot={{r:3,fill:'#4ade80'}} activeDot={{r:5}}/><Line type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2.5} dot={{r:3,fill:'#f87171'}} activeDot={{r:5}}/></LineChart></ResponsiveContainer>
          <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:8}}>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#3d5a7a'}}><span style={{width:10,height:3,borderRadius:2,background:'#4ade80'}}/>Income</div>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#3d5a7a'}}><span style={{width:10,height:3,borderRadius:2,background:'#f87171'}}/>Expense</div>
          </div>
        </div>
      </div>
    </div>
  )
}
