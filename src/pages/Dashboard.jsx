import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useTable } from '../hooks/useTable'
import { StatCard, PageLoader } from '../components/ui'
import { BookOpen, ClipboardList, Wallet, Timer, CheckSquare, Zap, AlertTriangle, ArrowRight, Clock, TrendingUp, TrendingDown, Star, Share2 } from 'lucide-react'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function Dashboard() {
  const { profile } = useAuth()
  const { data: notes,      loading: l1 } = useTable('notes',      { orderBy:'updated_at' })
  const { data: assignments,loading: l2 } = useTable('assignments', { orderBy:'due_date', ascending:true })
  const { data: expenses,   loading: l3 } = useTable('expenses',    { orderBy:'date' })
  const { data: timetable,  loading: l4 } = useTable('timetable',   { orderBy:'time', ascending:true })
  const { data: sessions,   loading: l5 } = useTable('timer_sessions')
  const { data: flashcards, loading: l6 } = useTable('flashcards')

  if (l1||l2||l3||l4||l5||l6) return <PageLoader/>

  const today      = DAYS[new Date().getDay()]
  const todaySlots = timetable.filter(s=>s.day===today).sort((a,b)=>a.time.localeCompare(b.time))
  const pending    = assignments.filter(a=>a.status!=='submitted')
  const income     = expenses.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0)
  const spent      = expenses.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0)
  const studyMins  = sessions.reduce((s,x)=>s+(x.duration||0),0)
  const h          = new Date().getHours()
  const greeting   = h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'
  const alerts     = assignments.filter(a=>{
    if(a.status==='submitted') return false
    return (new Date(a.due_date)-Date.now())/3600000 < 24
  })

  return (
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:22}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:26,color:'#f1f5f9'}}>
            {greeting}, <span className="grad-text">{profile?.name?.split(' ')[0]||'Student'}</span> 👋
          </h1>
          <p style={{color:'#3d5a7a',fontSize:13,marginTop:4}}>{format(new Date(),'EEEE, MMMM d, yyyy')}</p>
        </div>
        {profile?.cgpa && (
          <div className="card" style={{padding:'10px 18px',borderColor:'rgba(37,99,235,0.2)',background:'rgba(37,99,235,0.05)'}}>
            <p style={{fontSize:10,color:'#1e3a5f'}}>CGPA</p>
            <p style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:22,color:'#60a5fa'}}>{profile.cgpa}</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      {alerts.length>0&&(
        <div className="card" style={{padding:16,borderColor:'rgba(234,179,8,0.25)',background:'rgba(234,179,8,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <AlertTriangle size={16} style={{color:'#fbbf24'}}/>
            <span style={{fontWeight:600,fontSize:13,color:'#fde68a'}}>Deadline Alerts</span>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {alerts.map(a=>{
              const h=(new Date(a.due_date)-Date.now())/3600000,ov=h<0
              return <span key={a.id} className="badge" style={{fontSize:11,background:ov?'rgba(239,68,68,0.15)':'rgba(234,179,8,0.12)',borderColor:ov?'rgba(239,68,68,0.25)':'rgba(234,179,8,0.25)',color:ov?'#fca5a5':'#fde68a'}}>
                {ov?'🔴':'🟡'} {a.title} {ov?'(Overdue)':`(${Math.max(0,Math.round(h))}h)`}
              </span>
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12}}>
        <StatCard icon={BookOpen}      label="Notes"      value={notes.length}       color="#4ade80"/>
        <StatCard icon={ClipboardList} label="Pending"    value={pending.length}     color={pending.length>0?'#f87171':'#4ade80'}/>
        <StatCard icon={Wallet}        label="Balance"    value={`₹${(income-spent).toLocaleString('en-IN')}`} color={income>=spent?'#4ade80':'#f87171'}/>
        <StatCard icon={Timer}         label="Study Time" value={`${Math.round(studyMins/60)}h`} color="#fb923c"/>
        <StatCard icon={CheckSquare}   label="Classes"    value={todaySlots.length}  color="#38bdf8" sub="today"/>
        <StatCard icon={Zap}           label="Flashcards" value={flashcards.length}  color="#fbbf24"/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18}}>
        {/* Today classes */}
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Clock size={15} style={{color:'#38bdf8'}}/>Today's Classes</h3>
            <Link to="/timetable" style={{color:'#3b82f6',fontSize:12,display:'flex',alignItems:'center',gap:3,textDecoration:'none'}}>View all <ArrowRight size={11}/></Link>
          </div>
          {todaySlots.length===0
            ? <div style={{textAlign:'center',padding:'28px 0',color:'#1e3a5f'}}><Clock size={30} style={{margin:'0 auto 8px',opacity:0.3}}/><p style={{fontSize:13}}>No classes today 🎉</p></div>
            : <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {todaySlots.map(s=>(
                  <div key={s.id} className="table-row">
                    <div style={{width:3,height:34,borderRadius:2,background:s.color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:600,color:'#e2e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.subject}</p><p style={{fontSize:11,color:'#1e3a5f'}}>{s.faculty} · {s.room}</p></div>
                    <span style={{fontFamily:'monospace',fontSize:12,color:'#3d5a7a',flexShrink:0}}>{s.time}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Assignments */}
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><ClipboardList size={15} style={{color:'#f87171'}}/>Upcoming Tasks</h3>
            <Link to="/assignments" style={{color:'#3b82f6',fontSize:12,display:'flex',alignItems:'center',gap:3,textDecoration:'none'}}>View all <ArrowRight size={11}/></Link>
          </div>
          {pending.length===0
            ? <div style={{textAlign:'center',padding:'28px 0',color:'#1e3a5f'}}><CheckSquare size={30} style={{margin:'0 auto 8px',opacity:0.3}}/><p style={{fontSize:13}}>All caught up! 🎉</p></div>
            : <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {pending.slice(0,5).map(a=>{
                  const hr=(new Date(a.due_date)-Date.now())/3600000,ov=hr<0,ug=hr<12&&!ov,wn=hr<24&&!ug&&!ov
                  const dot=ov||ug?'#f87171':wn?'#fbbf24':'#4ade80'
                  return <div key={a.id} className="table-row">
                    <span style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:500,color:'#e2e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</p><p style={{fontSize:11,color:'#1e3a5f'}}>{a.subject}</p></div>
                    <span className="badge" style={{fontSize:10,flexShrink:0,background:ov?'rgba(239,68,68,0.12)':wn?'rgba(251,191,36,0.12)':'rgba(74,222,128,0.08)',borderColor:ov?'rgba(239,68,68,0.2)':wn?'rgba(251,191,36,0.2)':'rgba(74,222,128,0.15)',color:ov?'#fca5a5':wn?'#fde68a':'#86efac'}}>
                      {ov?'Overdue':format(new Date(a.due_date),'MMM d')}
                    </span>
                  </div>
                })}
              </div>
          }
        </div>

        {/* Notes */}
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><BookOpen size={15} style={{color:'#4ade80'}}/>Recent Notes</h3>
            <Link to="/notes" style={{color:'#3b82f6',fontSize:12,display:'flex',alignItems:'center',gap:3,textDecoration:'none'}}>View all <ArrowRight size={11}/></Link>
          </div>
          {notes.length===0
            ? <div style={{textAlign:'center',padding:'28px 0',color:'#1e3a5f'}}><BookOpen size={30} style={{margin:'0 auto 8px',opacity:0.3}}/><p style={{fontSize:13}}>No notes yet</p></div>
            : <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {notes.slice(0,5).map(n=>(
                  <div key={n.id} className="table-row">
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}><p style={{fontSize:13,fontWeight:500,color:'#e2e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{n.title}</p>{n.favorite&&<Star size={11} style={{color:'#fbbf24',flexShrink:0}} fill="#fbbf24"/>}</div>
                      {n.subject&&<p style={{fontSize:11,color:'#1e3a5f'}}>{n.subject}</p>}
                    </div>
                    <span style={{fontSize:11,color:'#1e2d45',flexShrink:0}}>{format(new Date(n.updated_at),'MMM d')}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Expenses */}
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',display:'flex',alignItems:'center',gap:8}}><Wallet size={15} style={{color:'#4ade80'}}/>Expenses</h3>
            <Link to="/expenses" style={{color:'#3b82f6',fontSize:12,display:'flex',alignItems:'center',gap:3,textDecoration:'none'}}>View all <ArrowRight size={11}/></Link>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
            {[{l:'Income',v:`₹${income.toLocaleString('en-IN')}`,c:'#4ade80',bg:'rgba(74,222,128,0.07)',bc:'rgba(74,222,128,0.15)'},{l:'Spent',v:`₹${spent.toLocaleString('en-IN')}`,c:'#f87171',bg:'rgba(248,113,113,0.07)',bc:'rgba(248,113,113,0.15)'},{l:'Balance',v:`₹${Math.abs(income-spent).toLocaleString('en-IN')}`,c:income>=spent?'#60a5fa':'#f87171',bg:income>=spent?'rgba(96,165,250,0.07)':'rgba(248,113,113,0.07)',bc:income>=spent?'rgba(96,165,250,0.15)':'rgba(248,113,113,0.15)'}].map(x=>(
              <div key={x.l} style={{background:x.bg,border:`1px solid ${x.bc}`,borderRadius:9,padding:'9px 8px',textAlign:'center'}}>
                <p style={{fontSize:10,color:'#3d5a7a',marginBottom:3}}>{x.l}</p>
                <p style={{fontSize:12,fontWeight:700,color:x.c}}>{x.v}</p>
              </div>
            ))}
          </div>
          {expenses.slice(0,3).map(e=>(
            <div key={e.id} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:7}}>
              <div style={{display:'flex',alignItems:'center',gap:7,minWidth:0}}>
                <span style={{width:5,height:5,borderRadius:'50%',background:e.type==='income'?'#4ade80':'#f87171',flexShrink:0}}/>
                <span style={{color:'#64748b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.description}</span>
              </div>
              <span style={{color:e.type==='income'?'#4ade80':'#f87171',fontWeight:600,flexShrink:0,marginLeft:8}}>{e.type==='income'?'+':'-'}₹{e.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{padding:20}}>
        <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>Quick Actions</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10}}>
          {[
            {to:'/notes',       e:'📝',label:'New Note',    g:'linear-gradient(135deg,#1d4ed8,#3b82f6)'},
            {to:'/assignments', e:'📋',label:'Add Task',    g:'linear-gradient(135deg,#7c3aed,#a855f7)'},
            {to:'/studyroom',   e:'👥',label:'Study Room',  g:'linear-gradient(135deg,#0f766e,#14b8a6)'},
            {to:'/timer',       e:'⏱️',label:'Study Timer', g:'linear-gradient(135deg,#92400e,#f59e0b)'},
          ].map(x=>(
            <Link key={x.to} to={x.to} style={{textDecoration:'none'}}>
              <div className="card" style={{padding:'14px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:9,cursor:'pointer',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}>
                <div style={{width:40,height:40,borderRadius:12,background:x.g,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 14px rgba(0,0,0,0.35)'}}>{x.e}</div>
                <span style={{fontSize:12,fontWeight:600,color:'#64748b',textAlign:'center'}}>{x.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
