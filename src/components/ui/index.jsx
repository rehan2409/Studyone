import React from 'react'
import { X, Loader2 } from 'lucide-react'

export function Modal({ open, onClose, title, children, maxW = 540 }) {
  if (!open) return null
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box page" style={{ maxWidth: maxW, width:'100%' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 22px 0' }}>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:19, color:'#f1f5f9' }}>{title}</h2>
          <button className="btn-icon" onClick={onClose} style={{ color:'#3d5a7a' }}><X size={18}/></button>
        </div>
        <div style={{ padding:'16px 22px 22px' }}>{children}</div>
      </div>
    </div>
  )
}

export function Spinner({ size = 22 }) {
  return <Loader2 size={size} style={{ animation:'spin 0.8s linear infinite', color:'#3b82f6' }}/>
}

export function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
      <div style={{ textAlign:'center' }}>
        <Spinner size={28}/>
        <p style={{ color:'#3d5a7a', fontSize:13, marginTop:10 }}>Loading…</p>
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, desc, action }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 16px', textAlign:'center' }}>
      {Icon && <Icon size={44} style={{ color:'#1e2d45', marginBottom:12 }}/>}
      <p style={{ color:'#64748b', fontWeight:600, fontSize:15 }}>{title}</p>
      {desc && <p style={{ color:'#3d5a7a', fontSize:13, marginTop:5, maxWidth:280, lineHeight:1.6 }}>{desc}</p>}
      {action && <div style={{ marginTop:16 }}>{action}</div>}
    </div>
  )
}

export function Badge({ children, color = 'gray' }) {
  const s = {
    blue:   ['rgba(59,130,246,0.12)',  'rgba(59,130,246,0.25)',  '#93c5fd'],
    green:  ['rgba(74,222,128,0.1)',   'rgba(74,222,128,0.25)',  '#86efac'],
    red:    ['rgba(248,113,113,0.12)', 'rgba(248,113,113,0.25)', '#fca5a5'],
    yellow: ['rgba(251,191,36,0.12)',  'rgba(251,191,36,0.25)',  '#fde68a'],
    purple: ['rgba(167,139,250,0.12)', 'rgba(167,139,250,0.25)', '#c4b5fd'],
    orange: ['rgba(251,146,60,0.12)',  'rgba(251,146,60,0.25)',  '#fdba74'],
    gray:   ['rgba(51,65,85,0.5)',     'rgba(71,85,105,0.4)',    '#64748b'],
  }[color] || ['rgba(51,65,85,0.5)','rgba(71,85,105,0.4)','#64748b']
  return <span className="badge" style={{ background:s[0], borderColor:s[1], color:s[2] }}>{children}</span>
}

export function StatCard({ icon: Icon, label, value, color = '#3b82f6', sub, onClick }) {
  return (
    <div className="card" onClick={onClick}
      style={{ padding:'18px', display:'flex', flexDirection:'column', gap:4, cursor:onClick?'pointer':'default',
        transition:'all 0.2s', borderColor:`${color}20` }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.borderColor=`${color}40`}}
      onMouseLeave={e=>{ if(onClick) e.currentTarget.style.borderColor=`${color}20`}}>
      <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
        <Icon size={18} style={{ color }}/>
      </div>
      <p style={{ fontSize:24, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color }}>{value}</p>
      <p style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{label}</p>
      {sub && <p style={{ fontSize:11, color:'#3d5a7a' }}>{sub}</p>}
    </div>
  )
}

export function ProgressRing({ pct, size = 80, stroke = 7, color = '#3b82f6' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-Math.min(pct,100)/100)}
        style={{ transition:'stroke-dashoffset 0.7s ease' }}/>
    </svg>
  )
}

export function Divider() {
  return <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'4px 0' }}/>
}
