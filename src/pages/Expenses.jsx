import React,{useState} from 'react'
import {useTable} from '../hooks/useTable'
import {Modal,PageLoader} from '../components/ui'
import {PieChart,Pie,Cell,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts'
import {format,subDays} from 'date-fns'
import {Plus,Trash2,TrendingUp,TrendingDown,Wallet} from 'lucide-react'
import toast from 'react-hot-toast'
const CATS=['Food','Travel','Books','Stationery','Fees','Hostel','Internet','Entertainment','Other']
const CC={Food:'#f59e0b',Travel:'#3b82f6',Books:'#8b5cf6',Stationery:'#10b981',Fees:'#ef4444',Hostel:'#ec4899',Internet:'#06b6d4',Entertainment:'#f97316',Other:'#64748b'}
const T={contentStyle:{background:'#0d1220',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,fontSize:12},cursor:{fill:'rgba(255,255,255,0.02)'}}
export default function Expenses(){
  const {data,loading,insert,remove}=useTable('expenses',{orderBy:'date'})
  const [modal,setModal]=useState(false),[form,setForm]=useState({type:'expense',amount:'',category:'Food',description:''}),[tab,setTab]=useState('all')
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const income=data.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0)
  const spent=data.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0)
  const catTotals={};data.filter(e=>e.type==='expense').forEach(e=>{catTotals[e.category]=(catTotals[e.category]||0)+e.amount})
  const pieData=Object.entries(catTotals).map(([name,value])=>({name,value}))
  const barData=Array.from({length:7},(_,i)=>{const d=subDays(new Date(),6-i),ds=format(d,'yyyy-MM-dd');return{label:format(d,'EEE'),income:data.filter(e=>e.type==='income'&&format(new Date(e.date),'yyyy-MM-dd')===ds).reduce((s,e)=>s+e.amount,0),expense:data.filter(e=>e.type==='expense'&&format(new Date(e.date),'yyyy-MM-dd')===ds).reduce((s,e)=>s+e.amount,0)}})
  const filtered=tab==='all'?data:data.filter(e=>e.type===tab)
  const save=async()=>{
    if(!form.amount||!form.description.trim()){toast.error('Fill all fields');return}
    try{await insert({...form,amount:parseFloat(form.amount),date:new Date().toISOString()});toast.success('Entry added ✓');setForm({type:'expense',amount:'',category:'Food',description:''});setModal(false)}catch(e){toast.error(e.message)}
  }
  if(loading) return <PageLoader/>
  return(
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Expense Tracker</h1><p style={{color:'#3d5a7a',fontSize:13}}>Track spending in ₹</p></div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={15}/>Add Entry</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[{icon:TrendingUp,l:'Income',v:`₹${income.toLocaleString('en-IN')}`,c:'#4ade80',bc:'rgba(74,222,128,0.2)',bg:'rgba(74,222,128,0.07)'},{icon:TrendingDown,l:'Spent',v:`₹${spent.toLocaleString('en-IN')}`,c:'#f87171',bc:'rgba(248,113,113,0.2)',bg:'rgba(248,113,113,0.07)'},{icon:Wallet,l:'Balance',v:`₹${Math.abs(income-spent).toLocaleString('en-IN')}`,c:income>=spent?'#60a5fa':'#f87171',bc:income>=spent?'rgba(96,165,250,0.2)':'rgba(248,113,113,0.2)',bg:income>=spent?'rgba(96,165,250,0.07)':'rgba(248,113,113,0.07)'}].map(x=>(
          <div key={x.l} className="card" style={{padding:18,borderColor:x.bc,background:x.bg}}>
            <x.icon size={18} style={{color:x.c,marginBottom:8}}/>
            <p style={{fontSize:22,fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,color:x.c}}>{x.v}</p>
            <p style={{fontSize:13,color:'#3d5a7a',marginTop:2}}>{x.l}</p>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>By Category</h3>
          {pieData.length===0?<p style={{color:'#1e3a5f',fontSize:13,textAlign:'center',padding:'28px 0'}}>No expenses yet</p>:(
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <ResponsiveContainer width={130} height={130}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={34} outerRadius={60} dataKey="value" paddingAngle={3}>{pieData.map(e=><Cell key={e.name} fill={CC[e.name]||'#64748b'}/>)}</Pie></PieChart></ResponsiveContainer>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:5}}>{pieData.map(d=><div key={d.name} style={{display:'flex',justifyContent:'space-between',fontSize:12}}><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:7,height:7,borderRadius:'50%',background:CC[d.name]}}/><span style={{color:'#64748b'}}>{d.name}</span></div><span style={{color:'#e2e8f0',fontWeight:600}}>₹{d.value}</span></div>)}</div>
            </div>
          )}
        </div>
        <div className="card" style={{padding:20}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:14}}>Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={140}><BarChart data={barData} barSize={13}><XAxis dataKey="label" tick={{fill:'#1e3a5f',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#1e3a5f',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>'₹'+v}/><Tooltip {...T} formatter={(v,n)=>['₹'+v,n]}/><Bar dataKey="income" fill="#4ade80" opacity={0.85} radius={[4,4,0,0]}/><Bar dataKey="expense" fill="#f87171" opacity={0.85} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div className="card" style={{padding:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:15,color:'#f1f5f9'}}>Transactions</h3>
          <div style={{display:'flex',gap:6}}>{['all','income','expense'].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'5px 11px',borderRadius:8,border:'none',background:tab===t?'#2563eb':'rgba(255,255,255,0.04)',color:tab===t?'#fff':'#3d5a7a',cursor:'pointer',fontSize:12,textTransform:'capitalize'}}>{t}</button>)}</div>
        </div>
        {filtered.length===0?<p style={{textAlign:'center',color:'#1e3a5f',padding:'20px 0',fontSize:13}}>No transactions</p>:
          <div style={{display:'flex',flexDirection:'column',gap:7,maxHeight:280,overflowY:'auto'}}>
            {filtered.map(e=>(
              <div key={e.id} className="table-row">
                <span style={{width:30,height:30,borderRadius:9,background:e.type==='income'?'rgba(74,222,128,0.12)':'rgba(248,113,113,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:e.type==='income'?'#4ade80':'#f87171',flexShrink:0}}>{e.type==='income'?'+':'-'}</span>
                <div style={{flex:1,minWidth:0}}><p style={{fontSize:13,fontWeight:500,color:'#e2e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.description}</p><p style={{fontSize:11,color:'#1e3a5f'}}>{e.category} · {format(new Date(e.date),'MMM d')}</p></div>
                <span style={{fontSize:14,fontWeight:700,color:e.type==='income'?'#4ade80':'#f87171',flexShrink:0}}>{e.type==='income'?'+':'-'}₹{e.amount}</span>
                <button className="btn-icon" style={{color:'#f87171'}} onClick={async()=>{try{await remove(e.id)}catch(err){toast.error(err.message)}}}><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        }
      </div>
      <Modal open={modal} onClose={()=>setModal(false)} title="Add Entry" maxW={420}>
        <div style={{display:'flex',flexDirection:'column',gap:13}}>
          <div style={{display:'flex',background:'rgba(7,11,20,0.8)',borderRadius:11,padding:3,gap:3}}>{['expense','income'].map(t=><button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{flex:1,padding:'8px 0',borderRadius:9,border:'none',cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:'Inter,sans-serif',background:form.type===t?(t==='income'?'#16a34a':'#dc2626'):'transparent',color:form.type===t?'#fff':'#3d5a7a',transition:'all 0.15s',textTransform:'capitalize'}}>{t}</button>)}</div>
          <div><label className="label">Amount (₹) *</label><input className="input" type="number" min="0" placeholder="0" value={form.amount} onChange={set('amount')}/></div>
          <div><label className="label">Category</label><select className="input" value={form.category} onChange={set('category')}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="label">Description *</label><input className="input" placeholder="What was this for?" value={form.description} onChange={set('description')}/></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)'}}><button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-primary" onClick={save}>Add Entry</button></div>
        </div>
      </Modal>
    </div>
  )
}
