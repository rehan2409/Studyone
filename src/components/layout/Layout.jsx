import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, BookOpen, ClipboardList, Wallet, Clock, CheckSquare,
  Zap, Timer, Share2, BarChart2, User, LogOut, Menu, X, ChevronRight,
  GraduationCap, Bell
} from 'lucide-react'

const NAV = [
  { g:'Main', items:[
    { to:'/dashboard',   icon:LayoutDashboard, label:'Dashboard',   c:'#60a5fa' },
    { to:'/notes',       icon:BookOpen,        label:'Notes',       c:'#4ade80' },
    { to:'/assignments', icon:ClipboardList,   label:'Assignments', c:'#f87171' },
  ]},
  { g:'Academic', items:[
    { to:'/timetable',  icon:Clock,       label:'Timetable',   c:'#38bdf8' },
    { to:'/attendance', icon:CheckSquare, label:'Attendance',  c:'#34d399' },
    { to:'/flashcards', icon:Zap,         label:'Flashcards',  c:'#fbbf24' },
    { to:'/timer',      icon:Timer,       label:'Study Timer', c:'#fb923c' },
  ]},
  { g:'Collaborate', items:[
    { to:'/studyroom',  icon:Share2,   label:'Study Room', c:'#a78bfa' },
    { to:'/analytics',  icon:BarChart2,label:'Analytics',  c:'#818cf8' },
  ]},
]

export default function Layout() {
  const { profile, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  const initials = (profile?.name||'S').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  useEffect(() => { setOpen(false) }, [loc.pathname])

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#070b14' }}>
      {open && <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:30, backdropFilter:'blur(3px)' }}/>}

      {/* Sidebar */}
      <aside id="sidebar" style={{
        width:240, background:'rgba(7,11,20,0.98)', borderRight:'1px solid rgba(255,255,255,0.05)',
        display:'flex', flexDirection:'column', zIndex:40,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:11, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.4)' }}>
              <GraduationCap size={19} color="#fff"/>
            </div>
            <div>
              <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:'#f1f5f9', fontSize:17, lineHeight:1 }}>StudyOne</p>
              <p style={{ fontSize:10, color:'#1e3a5f', marginTop:2 }}>Student Platform</p>
            </div>
          </div>
          <button className="btn-icon" onClick={()=>setOpen(false)}><X size={16}/></button>
        </div>

        {/* User pill */}
        <div onClick={()=>nav('/profile')} style={{ margin:'10px 10px 4px', padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10, cursor:'pointer', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>{initials}</div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <p style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.name||'Student'}</p>
            <p style={{ fontSize:10, color:'#1e3a5f' }}>{profile?.branch||'Student'}{profile?.cgpa?' · '+profile.cgpa:''}</p>
          </div>
          <ChevronRight size={12} color="#1e3a5f"/>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'4px 8px', display:'flex', flexDirection:'column', gap:14 }}>
          {NAV.map(grp => (
            <div key={grp.g}>
              <p style={{ fontSize:9, fontWeight:700, color:'#1a2d45', textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 6px', marginBottom:3 }}>{grp.g}</p>
              {grp.items.map(item => (
                <NavLink key={item.to} to={item.to} className={({isActive})=>`nav-link${isActive?' active':''}`}>
                  {({isActive})=><>
                    <item.icon size={15} style={{ color:isActive?'#60a5fa':item.c, opacity:isActive?1:0.55, flexShrink:0 }}/>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {isActive && <ChevronRight size={11} style={{ color:'rgba(96,165,250,0.5)' }}/>}
                  </>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'8px 8px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <NavLink to="/profile" className={({isActive})=>`nav-link${isActive?' active':''}`}>
            <User size={15} style={{ color:'#1e3a5f' }}/><span>Profile</span>
          </NavLink>
          <button className="nav-link" style={{ color:'rgba(248,113,113,0.6)', width:'100%', marginTop:2 }} onClick={logout}>
            <LogOut size={15}/><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div id="main" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header style={{ height:52, background:'rgba(7,11,20,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
          <button className="btn-icon" onClick={()=>setOpen(v=>!v)}>
            <Menu size={18}/>
          </button>
          <div style={{ flex:1 }}/>
          <button className="btn-icon" style={{ position:'relative' }}>
            <Bell size={16}/>
            <span style={{ position:'absolute', top:5, right:5, width:6, height:6, background:'#3b82f6', borderRadius:'50%' }}/>
          </button>
          <div onClick={()=>nav('/profile')} style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>{initials}</div>
        </header>
        <main style={{ flex:1, overflowY:'auto' }}>
          <div className="page"><Outlet/></div>
        </main>
      </div>
    </div>
  )
}
