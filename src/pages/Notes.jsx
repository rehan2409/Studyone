import React, { useState } from 'react'
import { useTable } from '../hooks/useTable'
import { Modal, Empty, Badge, PageLoader } from '../components/ui'
import SubjectInput from '../components/ui/SubjectInput'
import { format } from 'date-fns'
import { Plus, Search, Star, Trash2, Edit3, Download, BookOpen, FileText, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ec4899','#64748b']
const BLANK  = { title:'', content:'', subject:'', tags:'', color_idx:0, favorite:false }

async function exportPDF(note) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const margin = 20, lineH = 8, maxW = 170

    // Title
    doc.setFontSize(20)
    doc.setTextColor(30, 60, 120)
    doc.text(note.title, margin, 28)

    // Meta
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Subject: ${note.subject || 'N/A'}   |   Date: ${format(new Date(note.updated_at), 'PPP')}`, margin, 38)
    if (note.tags?.length) doc.text(`Tags: ${note.tags.join(', ')}`, margin, 45)

    // Divider
    doc.setDrawColor(200, 210, 230)
    doc.line(margin, 50, 190, 50)

    // Content
    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    const lines = doc.splitTextToSize(note.content || '(empty)', maxW)
    let y = 60
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, margin, y)
      y += lineH
    })

    doc.save(`${note.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
    toast.success('PDF downloaded!')
  } catch (e) {
    toast.error('PDF export failed: ' + e.message)
  }
}

function exportTxt(note) {
  const text = `# ${note.title}\n\nSubject: ${note.subject || 'N/A'}\nDate: ${format(new Date(note.updated_at), 'PPP')}\nTags: ${(note.tags||[]).join(', ')}\n\n${note.content || ''}`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  a.download = note.title.replace(/[^a-z0-9]/gi, '_') + '.txt'
  a.click()
  toast.success('TXT downloaded!')
}

export default function Notes() {
  const { data: notes, loading, insert, update, remove } = useTable('notes', { orderBy:'updated_at' })
  const [search, setSearch]     = useState('')
  const [subj, setSubj]         = useState('All')
  const [fav, setFav]           = useState(false)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(BLANK)
  const [exportMenu, setExportMenu] = useState(null)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const filtered = notes.filter(n =>
    (!search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content||'').toLowerCase().includes(search.toLowerCase())) &&
    (subj === 'All' || n.subject === subj) &&
    (!fav || n.favorite)
  )

  const openNew  = () => { setEditing(null); setForm(BLANK); setModal(true) }
  const openEdit = n => {
    setEditing(n.id)
    setForm({ title:n.title, content:n.content||'', subject:n.subject||'', tags:(n.tags||[]).join(', '), color_idx:n.color_idx||0, favorite:n.favorite })
    setModal(true)
  }

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return }
    const d = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), updated_at: new Date().toISOString() }
    try {
      if (editing) { await update(editing, d); toast.success('Note updated ✓') }
      else         { await insert(d);           toast.success('Note saved ✓') }
      setModal(false)
    } catch(e) { toast.error(e.message) }
  }

  // unique subjects from notes for filter bar
  const subjects = ['All', ...new Set(notes.map(n => n.subject).filter(Boolean))]

  if (loading) return <PageLoader />

  return (
    <div style={{ padding:24 }} onClick={() => setExportMenu(null)}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:24, color:'#f1f5f9' }}>Notes</h1>
          <p style={{ color:'#3d5a7a', fontSize:13 }}>{notes.length} notes • cloud synced</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={15}/> New Note</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:11, color:'#1e3a5f' }}/>
          <input className="input" style={{ paddingLeft:36 }} placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="input" style={{ width:'auto' }} value={subj} onChange={e => setSubj(e.target.value)}>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setFav(!fav)} style={{ padding:'9px 14px', borderRadius:12, border:`1px solid ${fav?'rgba(251,191,36,0.35)':'rgba(255,255,255,0.07)'}`, background:fav?'rgba(251,191,36,0.08)':'transparent', color:fav?'#fbbf24':'#3d5a7a', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
          <Star size={14} fill={fav?'#fbbf24':'none'}/> Starred
        </button>
      </div>

      {/* Notes grid */}
      {filtered.length === 0
        ? <Empty icon={BookOpen} title="No notes found" action={<button className="btn-primary" onClick={openNew}><Plus size={14}/> New Note</button>}/>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
            {filtered.map(n => {
              const c = COLORS[n.color_idx || 0]
              return (
                <div key={n.id} className="card" style={{ padding:16, borderColor:`${c}25`, background:`${c}07`, position:'relative', transition:'transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02)'; e.currentTarget.querySelector('.na').style.opacity='1' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.querySelector('.na').style.opacity='0' }}>
                  {/* Action bar */}
                  <div className="na" style={{ position:'absolute', top:10, right:10, display:'flex', gap:2, opacity:0, transition:'opacity 0.15s', background:'rgba(7,11,20,0.92)', borderRadius:8, padding:3, border:'1px solid rgba(255,255,255,0.07)' }}>
                    <button className="btn-icon" style={{ padding:5, color:n.favorite?'#fbbf24':'#3d5a7a' }}
                      onClick={e => { e.stopPropagation(); update(n.id,{favorite:!n.favorite,updated_at:new Date().toISOString()}) }}>
                      <Star size={12} fill={n.favorite?'#fbbf24':'none'}/>
                    </button>
                    <button className="btn-icon" style={{ padding:5 }} onClick={e => { e.stopPropagation(); openEdit(n) }}>
                      <Edit3 size={12}/>
                    </button>
                    {/* Export dropdown */}
                    <div style={{ position:'relative' }}>
                      <button className="btn-icon" style={{ padding:5 }} onClick={e => { e.stopPropagation(); setExportMenu(exportMenu===n.id?null:n.id) }}>
                        <Download size={12}/>
                      </button>
                      {exportMenu === n.id && (
                        <div style={{ position:'absolute', right:0, top:'110%', background:'#0d1220', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, padding:4, zIndex:200, minWidth:170, boxShadow:'0 8px 24px rgba(0,0,0,0.6)' }} onClick={e=>e.stopPropagation()}>
                          <button onClick={() => { exportPDF(n); setExportMenu(null) }}
                            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', background:'transparent', border:'none', color:'#f87171', fontSize:12, cursor:'pointer', borderRadius:7, fontFamily:'Inter,sans-serif' }}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <FileText size={13}/> Export as PDF
                          </button>
                          <button onClick={() => { exportTxt(n); setExportMenu(null) }}
                            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 12px', background:'transparent', border:'none', color:'#94a3b8', fontSize:12, cursor:'pointer', borderRadius:7, fontFamily:'Inter,sans-serif' }}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <Download size={13}/> Export as TXT
                          </button>
                        </div>
                      )}
                    </div>
                    <button className="btn-icon" style={{ padding:5, color:'#f87171' }}
                      onClick={e => { e.stopPropagation(); remove(n.id); toast.success('Deleted') }}>
                      <Trash2 size={12}/>
                    </button>
                  </div>

                  <h3 style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', lineHeight:1.4, marginBottom:8, paddingRight:22 }}>{n.title}</h3>
                  {n.content && (
                    <p style={{ fontSize:12, color:'#3d5a7a', lineHeight:1.5, marginBottom:10, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {n.content.slice(0, 200)}
                    </p>
                  )}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
                    {n.subject && <Badge color="blue">{n.subject}</Badge>}
                    {(n.tags||[]).slice(0,2).map(t => <span key={t} style={{ fontSize:10, color:'#1e3a5f' }}>#{t}</span>)}
                    <span style={{ fontSize:10, color:'#1e2d45', marginLeft:'auto' }}>{format(new Date(n.updated_at),'MMM d')}</span>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* Create/Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Note' : 'New Note'} maxW={640}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="Note title…" value={form.title} onChange={set('title')} autoFocus/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">Subject (type or select)</label>
              <SubjectInput value={form.subject} onChange={v => setForm(p => ({ ...p, subject:v }))}/>
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" placeholder="exam, chapter1, important" value={form.tags} onChange={set('tags')}/>
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {COLORS.map((c,i) => (
                <button key={i} onClick={() => setForm(p => ({ ...p, color_idx:i }))}
                  style={{ width:22, height:22, borderRadius:'50%', background:c, border:form.color_idx===i?'2px solid #fff':'2px solid transparent', outline:form.color_idx===i?`2px solid ${c}`:'none', outlineOffset:2, cursor:'pointer' }}/>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input" style={{ minHeight:200, resize:'vertical', lineHeight:1.7 }}
              placeholder="Write your notes here…" value={form.content} onChange={set('content')}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#64748b' }}>
              <input type="checkbox" checked={form.favorite} onChange={e => setForm(p => ({ ...p, favorite:e.target.checked }))} style={{ accentColor:'#fbbf24' }}/>
              <Star size={13} style={{ color:'#fbbf24' }}/> Mark as favourite
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}>{editing ? 'Update Note' : 'Save Note'}</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
