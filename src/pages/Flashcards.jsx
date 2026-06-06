import React,{useState} from 'react'
import {useTable} from '../hooks/useTable'
import {Modal,Empty,Badge,PageLoader} from '../components/ui'
import SubjectInput from '../components/ui/SubjectInput'
import {Plus,X,ChevronLeft,ChevronRight,RotateCcw,Zap} from 'lucide-react'
import toast from 'react-hot-toast'
const BLANK={subject:'',question:'',answer:'',difficulty:'medium'}
export default function Flashcards(){
  const {data,loading,insert,remove}=useTable('flashcards')
  const [modal,setModal]=useState(false),[form,setForm]=useState(BLANK),[study,setStudy]=useState(false),[idx,setIdx]=useState(0),[flipped,setFlipped]=useState(false),[filter,setFilter]=useState('All')
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}))
  const subjects=['All',...new Set(data.map(f=>f.subject).filter(Boolean))]
  const filtered=filter==='All'?data:data.filter(f=>f.subject===filter)
  const save=async()=>{
    if(!form.question.trim()||!form.answer.trim()){toast.error('Fill question and answer');return}
    try{await insert(form);toast.success('Card added ✓');setForm(BLANK);setModal(false)}catch(e){toast.error(e.message)}
  }
  const next=()=>{setIdx(i=>(i+1)%filtered.length);setFlipped(false)}
  const prev=()=>{setIdx(i=>(i-1+filtered.length)%filtered.length);setFlipped(false)}
  if(loading) return <PageLoader/>
  if(study&&filtered.length>0){
    const card=filtered[idx]
    return(
      <div style={{padding:24}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Study Mode</h1>
          <button className="btn-secondary" onClick={()=>setStudy(false)}><X size={15}/>Exit</button>
        </div>
        <p style={{textAlign:'center',color:'#3d5a7a',fontSize:13,marginBottom:16}}>{idx+1} / {filtered.length}</p>
        <div style={{maxWidth:560,margin:'0 auto'}}>
          <div className="flip-card" style={{height:280,cursor:'pointer'}} onClick={()=>setFlipped(!flipped)}>
            <div className={`flip-inner${flipped?' flipped':''}`}>
              <div className="flip-front card" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,textAlign:'center',borderColor:'rgba(37,99,235,0.25)',background:'rgba(37,99,235,0.05)'}}>
                <span className="badge" style={{marginBottom:18,fontSize:11,background:'rgba(37,99,235,0.12)',borderColor:'rgba(37,99,235,0.25)',color:'#93c5fd'}}>QUESTION</span>
                <p style={{fontSize:20,fontWeight:600,color:'#f1f5f9',lineHeight:1.5}}>{card.question}</p>
                <p style={{color:'#1e3a5f',fontSize:12,marginTop:18}}>Click to reveal answer</p>
              </div>
              <div className="flip-back card" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,textAlign:'center',borderColor:'rgba(74,222,128,0.25)',background:'rgba(74,222,128,0.05)'}}>
                <span className="badge" style={{marginBottom:18,fontSize:11,background:'rgba(74,222,128,0.12)',borderColor:'rgba(74,222,128,0.25)',color:'#86efac'}}>ANSWER</span>
                <p style={{fontSize:17,color:'#e2e8f0',lineHeight:1.6}}>{card.answer}</p>
              </div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginTop:18}}>
            <button className="btn-secondary" onClick={prev}><ChevronLeft size={16}/>Prev</button>
            <button className="btn-secondary" onClick={()=>setFlipped(!flipped)}><RotateCcw size={14}/>Flip</button>
            <button className="btn-primary" onClick={next}>Next<ChevronRight size={16}/></button>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:14}}>
            {filtered.map((_,i)=><button key={i} onClick={()=>{setIdx(i);setFlipped(false)}} style={{width:i===idx?16:7,height:7,borderRadius:4,border:'none',background:i===idx?'#3b82f6':'rgba(255,255,255,0.1)',cursor:'pointer',transition:'all 0.2s'}}/>)}
          </div>
        </div>
      </div>
    )
  }
  return(
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:24,color:'#f1f5f9'}}>Flashcards</h1><p style={{color:'#3d5a7a',fontSize:13}}>{data.length} cards</p></div>
        <div style={{display:'flex',gap:8}}>
          {filtered.length>0&&<button className="btn-secondary" onClick={()=>{setIdx(0);setFlipped(false);setStudy(true)}}><Zap size={15}/>Study Now</button>}
          <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={15}/>Add Card</button>
        </div>
      </div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>
        {subjects.map(s=><button key={s} onClick={()=>setFilter(s)} style={{padding:'6px 13px',borderRadius:8,border:'none',background:filter===s?'#2563eb':'rgba(255,255,255,0.04)',color:filter===s?'#fff':'#3d5a7a',cursor:'pointer',fontSize:12,fontWeight:600}}>{s}</button>)}
      </div>
      {filtered.length===0?<Empty icon={Zap} title="No flashcards" action={<button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/>Add Card</button>}/>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:13}}>
          {filtered.map(c=>(
            <div key={c.id} className="card" style={{padding:18,transition:'border-color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <Badge color="blue">{c.subject||'General'}</Badge>
                <button className="btn-icon" style={{padding:3,color:'#f87171'}} onClick={async()=>{try{await remove(c.id)}catch(e){toast.error(e.message)}}}><X size={13}/></button>
              </div>
              <p style={{fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:10,lineHeight:1.4}}>{c.question}</p>
              <p style={{fontSize:12,color:'#3d5a7a',borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:10,lineHeight:1.5}}>{c.answer}</p>
              <div style={{marginTop:10}}><Badge color={c.difficulty==='hard'?'red':c.difficulty==='medium'?'yellow':'green'}>{c.difficulty}</Badge></div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title="New Flashcard">
        <div style={{display:'flex',flexDirection:'column',gap:13}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label className="label">Subject</label>
              <SubjectInput value={form.subject} onChange={v=>setForm(p=>({...p,subject:v}))} placeholder="Type or select"/>
            </div>
            <div><label className="label">Difficulty</label><select className="input" value={form.difficulty} onChange={set('difficulty')}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
          </div>
          <div><label className="label">Question *</label><textarea className="input" style={{minHeight:80,resize:'none'}} placeholder="Enter question…" value={form.question} onChange={set('question')}/></div>
          <div><label className="label">Answer *</label><textarea className="input" style={{minHeight:80,resize:'none'}} placeholder="Enter answer…" value={form.answer} onChange={set('answer')}/></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Add Card</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
