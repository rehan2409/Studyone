import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, ensureProfile } from '../context/AuthContext'
import { Modal } from '../components/ui'
import {
  Plus, Copy, Users, Send, Trash2, X, Link, Share2, LogIn,
  PenTool, Eraser, Square, Circle, Minus, Type, RotateCcw, RotateCw,
  Download, MessageSquare, FileText, Image, File, FolderOpen,
  Palette, ZoomIn, ZoomOut, ChevronRight, ExternalLink, Check
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// ── Whiteboard colours and tools ───────────────────────────
const STROKE_COLORS = ['#fff','#f87171','#fb923c','#facc15','#4ade80','#60a5fa','#a78bfa','#f472b6','#000']
const FILL_OPTIONS  = ['none','rgba(59,130,246,0.15)','rgba(74,222,128,0.15)','rgba(248,113,113,0.15)','rgba(251,191,36,0.15)','rgba(167,139,250,0.15)']
const TOOLS = [
  { id:'pen',    icon:PenTool, tip:'Pen' },
  { id:'line',   icon:Minus,   tip:'Line' },
  { id:'rect',   icon:Square,  tip:'Rectangle' },
  { id:'circle', icon:Circle,  tip:'Circle' },
  { id:'text',   icon:Type,    tip:'Text' },
  { id:'eraser', icon:Eraser,  tip:'Eraser' },
]

// ── Social share helper ─────────────────────────────────────
function shareVia(platform, url, text) {
  const links = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text+' '+url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    copy:     null,
  }
  if (platform === 'copy') { navigator.clipboard.writeText(url).catch(()=>{}); toast.success('Link copied!'); return }
  window.open(links[platform], '_blank')
}

export default function StudyRoom() {
  const { user, profile } = useAuth()
  const { code: urlCode } = useParams()
  const nav = useNavigate()

  // ── Rooms list ────────────────────────────────────────────
  const [rooms,       setRooms]       = useState([])
  const [activeRoom,  setActiveRoom]  = useState(null)
  const [members,     setMembers]     = useState([])
  const [messages,    setMessages]    = useState([])
  const [files,       setFiles]       = useState([])

  // ── UI state ──────────────────────────────────────────────
  const [tab,         setTab]         = useState('chat')   // chat | files | members
  const [panel,       setPanel]       = useState('room')   // room | whiteboard
  const [createModal, setCreateModal] = useState(false)
  const [shareModal,  setShareModal]  = useState(false)
  const [newRoom,     setNewRoom]     = useState({ name:'', subject:'' })
  const [joinCode,    setJoinCode]    = useState(urlCode || '')
  const [msg,         setMsg]         = useState('')
  const [uploading,   setUploading]   = useState(false)

  // ── Whiteboard state ──────────────────────────────────────
  const canvasRef    = useRef(null)
  const historyRef   = useRef([])
  const redoRef      = useRef([])
  const drawingRef   = useRef(false)
  const startPosRef  = useRef(null)
  const lastPosRef   = useRef(null)
  const snapshotRef  = useRef(null)
  const channelRef   = useRef(null)
  const msgEndRef    = useRef(null)
  const fileInputRef = useRef(null)

  const [tool,      setTool]      = useState('pen')
  const [color,     setColor]     = useState('#ffffff')
  const [fillColor, setFillColor] = useState('none')
  const [brushSize, setBrushSize] = useState(3)
  const [fontSize,  setFontSize]  = useState(20)
  const [textPos,   setTextPos]   = useState(null)
  const [textVal,   setTextVal]   = useState('')

  // ── Load rooms ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase.from('rooms').select('*').order('created_at', { ascending: false }).then(({ data }) => setRooms(data || []))
  }, [user])

  // ── Auto-join from URL ────────────────────────────────────
  useEffect(() => {
    if (urlCode && rooms.length > 0) {
      const r = rooms.find(x => x.code === urlCode.toUpperCase())
      if (r) openRoom(r)
    }
  }, [urlCode, rooms])

  // ── Open a room ───────────────────────────────────────────
  const openRoom = useCallback(async (room) => {
    setActiveRoom(room)
    setPanel('room')
    setTab('chat')

    // Load messages
    const { data: msgs } = await supabase.from('room_messages')
      .select('*').eq('room_id', room.id).order('created_at', { ascending: true })
    setMessages(msgs || [])

    // Load files
    const { data: fls } = await supabase.from('room_files')
      .select('*').eq('room_id', room.id).order('created_at', { ascending: false })
    setFiles(fls || [])

    // Load members
    const { data: mems } = await supabase.from('room_members')
      .select('*, profiles(name, branch)').eq('room_id', room.id)
    setMembers(mems || [])

    // Upsert membership
    await supabase.from('room_members').upsert(
      { room_id: room.id, user_id: user.id },
      { onConflict: 'room_id,user_id' }
    )

    // Real-time channel
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`room:${room.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'room_messages', filter:`room_id=eq.${room.id}` },
        p => setMessages(prev => [...prev, p.new]))
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'room_files', filter:`room_id=eq.${room.id}` },
        p => setFiles(prev => [p.new, ...prev]))
      .on('broadcast', { event:'draw' }, ({ payload }) => remoteDraw(payload))
      .on('broadcast', { event:'clear' }, () => clearCanvas(false))
      .subscribe()
    channelRef.current = ch
  }, [user])

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  // ── Canvas init ───────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    c.width = c.offsetWidth; c.height = c.offsetHeight
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#0a0f1a'; ctx.fillRect(0, 0, c.width, c.height)
  }, [])

  useEffect(() => {
    if (panel === 'whiteboard') setTimeout(initCanvas, 80)
  }, [panel, initCanvas])

  const getPos = e => {
    const r = canvasRef.current.getBoundingClientRect()
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const applyStroke = (ctx, stroke) => {
    const { tool:t, points, color:c, size:s, fill, fontSize:fs } = stroke
    ctx.strokeStyle = t === 'eraser' ? '#0a0f1a' : c
    ctx.fillStyle   = fill && fill !== 'none' ? fill : 'transparent'
    ctx.lineWidth   = t === 'eraser' ? s * 5 : s
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'

    if (t === 'pen' || t === 'eraser') {
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y)
      points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    } else if (t === 'line') {
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke()
    } else if (t === 'rect') {
      const w = points[1].x - points[0].x, h = points[1].y - points[0].y
      ctx.beginPath(); ctx.rect(points[0].x, points[0].y, w, h)
      if (fill && fill !== 'none') ctx.fill(); ctx.stroke()
    } else if (t === 'circle') {
      const rx = Math.abs(points[1].x - points[0].x) / 2, ry = Math.abs(points[1].y - points[0].y) / 2
      const cx = (points[0].x + points[1].x) / 2, cy = (points[0].y + points[1].y) / 2
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      if (fill && fill !== 'none') ctx.fill(); ctx.stroke()
    } else if (t === 'text') {
      ctx.font = `${fs}px Inter, sans-serif`; ctx.fillStyle = c; ctx.fillText(stroke.text, points[0].x, points[0].y)
    }
  }

  const remoteDraw = useCallback((stroke) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    applyStroke(ctx, stroke)
  }, [])

  const broadcast = useCallback((stroke) => {
    if (!channelRef.current || !activeRoom) return
    channelRef.current.send({ type:'broadcast', event:'draw', payload: stroke })
    // Persist to DB (debounced batch – here we persist per stroke for simplicity)
    supabase.from('whiteboard_strokes').insert({ room_id: activeRoom.id, stroke_data: stroke, created_by: profile?.name || 'Anonymous' })
  }, [activeRoom, profile])

  // ── Drawing handlers ──────────────────────────────────────
  const strokePointsRef = useRef([])

  const onDown = (e) => {
    e.preventDefault()
    if (tool === 'text') { const p = getPos(e); setTextPos(p); setTextVal(''); return }
    historyRef.current.push(canvasRef.current.toDataURL())
    if (historyRef.current.length > 25) historyRef.current.shift()
    redoRef.current = []
    drawingRef.current = true
    const pos = getPos(e)
    startPosRef.current = pos; lastPosRef.current = pos; strokePointsRef.current = [pos]
    if (['line','rect','circle'].includes(tool)) {
      snapshotRef.current = canvasRef.current.getContext('2d').getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const onMove = (e) => {
    e.preventDefault()
    if (!drawingRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    strokePointsRef.current.push(pos)

    if (tool === 'pen' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#0a0f1a' : color
      ctx.lineWidth   = tool === 'eraser' ? brushSize * 5 : brushSize
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath(); ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
      ctx.lineTo(pos.x, pos.y); ctx.stroke()
    } else if (['line','rect','circle'].includes(tool)) {
      ctx.putImageData(snapshotRef.current, 0, 0)
      applyStroke(ctx, { tool, points:[startPosRef.current, pos], color, size:brushSize, fill:fillColor })
    }
    lastPosRef.current = pos
  }

  const onUp = useCallback(() => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const stroke = {
      tool, color, size: brushSize, fill: fillColor,
      points: ['pen','eraser'].includes(tool) ? strokePointsRef.current : [startPosRef.current, lastPosRef.current]
    }
    broadcast(stroke)
    snapshotRef.current = null
  }, [tool, color, brushSize, fillColor, broadcast])

  const placeText = () => {
    if (!textVal.trim() || !textPos) { setTextPos(null); return }
    const ctx = canvasRef.current.getContext('2d')
    const stroke = { tool:'text', color, fontSize, text: textVal, points:[textPos] }
    applyStroke(ctx, stroke); broadcast(stroke)
    setTextPos(null); setTextVal('')
  }

  const undo = () => {
    if (!historyRef.current.length) return
    redoRef.current.push(canvasRef.current.toDataURL())
    const prev = historyRef.current.pop()
    const img = new Image(); img.src = prev
    img.onload = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); ctx.drawImage(img,0,0) }
  }

  const redo = () => {
    if (!redoRef.current.length) return
    historyRef.current.push(canvasRef.current.toDataURL())
    const next = redoRef.current.pop()
    const img = new Image(); img.src = next
    img.onload = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); ctx.drawImage(img,0,0) }
  }

  const clearCanvas = (broadcast_ = true) => {
    initCanvas()
    if (broadcast_ && channelRef.current) channelRef.current.send({ type:'broadcast', event:'clear', payload:{} })
    toast.success('Canvas cleared')
  }

  const exportWB = () => {
    const a = document.createElement('a'); a.download = `whiteboard-${Date.now()}.png`
    a.href = canvasRef.current.toDataURL(); a.click()
    toast.success('Exported!')
  }

  // ── Room actions ──────────────────────────────────────────
  const handleCreate = async () => {
    await ensureProfile(user)
    if (!newRoom.name.trim()) { toast.error('Enter room name'); return }
    const code = Math.random().toString(36).substring(2,8).toUpperCase()
    await ensureProfile(user)
    const { data, error } = await supabase.from('rooms')
      .insert({ code, name: newRoom.name, subject: newRoom.subject, created_by: user.id })
      .select().single()
    if (error) { toast.error(error.message); return }
    setRooms(p => [data, ...p])
    openRoom(data)
    setCreateModal(false); setNewRoom({ name:'', subject:'' })
    toast.success(`Room created! Code: ${code}`)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) { toast.error('Enter room code'); return }
    const { data } = await supabase.from('rooms').select('*').eq('code', joinCode.toUpperCase().trim()).single()
    if (!data) { toast.error('Room not found — check the code'); return }
    if (!rooms.find(r => r.id === data.id)) setRooms(p => [data, ...p])
    openRoom(data); setJoinCode('')
  }

  const sendMsg = async (e) => {
    e?.preventDefault()
    if (!msg.trim() || !activeRoom) return
    await supabase.from('room_messages').insert({
      room_id: activeRoom.id, user_id: user.id,
      sender_name: profile?.name || 'Anonymous', text: msg.trim(), type:'text'
    })
    setMsg('')
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file || !activeRoom) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return }
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${activeRoom.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('studyone-files').upload(path, file)
    if (upErr) { toast.error('Upload failed: ' + upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('studyone-files').getPublicUrl(path)
    await supabase.from('room_files').insert({
      room_id: activeRoom.id, user_id: user.id,
      name: file.name, type: file.type, size: file.size,
      url: publicUrl, path, uploaded_by: profile?.name || 'Anonymous'
    })
    await supabase.from('room_messages').insert({
      room_id: activeRoom.id, user_id: user.id,
      sender_name: profile?.name || 'Anonymous',
      text: `📎 Shared: ${file.name}`, type:'file', file_url: publicUrl, file_name: file.name
    })
    toast.success(`${file.name} uploaded!`)
    setUploading(false); e.target.value = ''
  }

  const fmtSize = b => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`

  const roomUrl = (code) => `${window.location.origin}/studyroom/${code}`

  const FileIcon = ({ type }) => {
    if (type?.startsWith('image/')) return <Image size={16} style={{color:'#60a5fa'}}/>
    if (type?.includes('pdf'))       return <FileText size={16} style={{color:'#f87171'}}/>
    return <File size={16} style={{color:'#94a3b8'}}/>
  }

  // ═══════════════════════════════════════════════════════════
  // ── RENDER ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ display:'flex', height:'calc(100vh - 52px)' }}>

      {/* ── Left: room list ────────────────────────────────── */}
      <div style={{ width:252, flexShrink:0, background:'rgba(7,11,20,0.98)', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 14px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:'#e2e8f0', marginBottom:10 }}>Study Rooms</h2>
          <button className="btn-primary" style={{ width:'100%', fontSize:12, padding:'8px 0' }} onClick={()=>setCreateModal(true)}>
            <Plus size={13}/> Create Room
          </button>
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            <input className="input" style={{ flex:1, fontSize:12, padding:'7px 10px', textTransform:'uppercase', letterSpacing:2 }}
              placeholder="ENTER CODE" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
              maxLength={6} onKeyDown={e=>e.key==='Enter'&&handleJoin()}/>
            <button className="btn-secondary" style={{ fontSize:12, padding:'7px 11px', flexShrink:0 }} onClick={handleJoin}>
              <LogIn size={14}/>
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {rooms.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 12px', color:'#1e3a5f' }}>
              <Share2 size={32} style={{ margin:'0 auto 8px', opacity:0.35 }}/>
              <p style={{ fontSize:12 }}>No rooms yet</p>
            </div>
          ) : rooms.map(r => (
            <button key={r.id} onClick={()=>openRoom(r)}
              style={{ width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:4, transition:'all 0.15s',
                background: activeRoom?.id===r.id ? 'rgba(37,99,235,0.15)' : 'transparent',
                borderLeft: activeRoom?.id===r.id ? '3px solid #3b82f6' : '3px solid transparent'
              }}
              onMouseEnter={e=>{ if(activeRoom?.id!==r.id) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
              onMouseLeave={e=>{ if(activeRoom?.id!==r.id) e.currentTarget.style.background='transparent' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ fontSize:13, fontWeight:600, color: activeRoom?.id===r.id?'#60a5fa':'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>{r.name}</p>
                <span style={{ fontSize:9, fontFamily:'monospace', background:'rgba(37,99,235,0.2)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)', borderRadius:4, padding:'2px 5px', flexShrink:0 }}>{r.code}</span>
              </div>
              {r.subject && <p style={{ fontSize:11, color:'#1e3a5f', marginTop:1 }}>{r.subject}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: active room ──────────────────────────────── */}
      {!activeRoom ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
          <div style={{ width:72, height:72, borderRadius:20, background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Share2 size={32} style={{ color:'#1e3a5f' }}/>
          </div>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'#3d5a7a' }}>Study Together</p>
            <p style={{ fontSize:13, color:'#1e3a5f', marginTop:6, maxWidth:280, lineHeight:1.7 }}>Create a room and share the link with friends. Collaborate on the whiteboard, chat, and share files in real-time.</p>
          </div>
          <button className="btn-primary" style={{ fontSize:14, padding:'10px 22px' }} onClick={()=>setCreateModal(true)}>
            <Plus size={15}/> Create Study Room
          </button>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Room header */}
          <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(7,11,20,0.98)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:'#f1f5f9' }}>{activeRoom.name}</h3>
                {activeRoom.subject && <span style={{ fontSize:11, color:'#1e3a5f', background:'rgba(255,255,255,0.04)', padding:'2px 8px', borderRadius:6 }}>{activeRoom.subject}</span>}
                <span style={{ fontSize:10, fontFamily:'monospace', color:'#3b82f6', background:'rgba(59,130,246,0.1)', padding:'2px 7px', borderRadius:5 }}>{activeRoom.code}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {/* Panel toggle */}
              <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:9, padding:3, gap:2 }}>
                {[['room','💬 Chat'],['whiteboard','🎨 Board']].map(([p,l]) => (
                  <button key={p} onClick={()=>setPanel(p)} style={{ padding:'5px 11px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Inter,sans-serif',
                    background: panel===p ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'transparent',
                    color: panel===p ? '#fff' : '#3d5a7a', transition:'all 0.15s' }}>{l}</button>
                ))}
              </div>
              <button className="btn-secondary" style={{ fontSize:12, padding:'6px 10px' }} onClick={()=>setShareModal(true)}>
                <Share2 size={13}/> Share
              </button>
            </div>
          </div>

          {/* ── WHITEBOARD PANEL ─────────────────────────────── */}
          {panel === 'whiteboard' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Toolbar */}
              <div style={{ padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(7,11,20,0.95)', display:'flex', flexWrap:'wrap', alignItems:'center', gap:10, flexShrink:0 }}>
                {/* Tools */}
                <div style={{ display:'flex', gap:2 }}>
                  {TOOLS.map(t => (
                    <button key={t.id} title={t.tip} onClick={()=>setTool(t.id)} style={{ padding:'7px', borderRadius:8, border:'none', cursor:'pointer', background:tool===t.id?'#2563eb':'transparent', color:tool===t.id?'#fff':'#3d5a7a', transition:'all 0.15s' }}>
                      <t.icon size={15}/>
                    </button>
                  ))}
                </div>
                <div style={{ width:1, height:24, background:'rgba(255,255,255,0.06)' }}/>
                {/* Colors */}
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {STROKE_COLORS.map(c => (
                    <button key={c} onClick={()=>setColor(c)} style={{ width:18, height:18, borderRadius:'50%', background:c, border:color===c?'2px solid #3b82f6':'2px solid transparent', outline:color===c?`2px solid ${c}`:'none', outlineOffset:2, cursor:'pointer' }}/>
                  ))}
                </div>
                {/* Fill */}
                {['rect','circle'].includes(tool) && (
                  <>
                    <div style={{ width:1, height:24, background:'rgba(255,255,255,0.06)' }}/>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <span style={{ fontSize:10, color:'#1e3a5f' }}>Fill</span>
                      {FILL_OPTIONS.map(f => (
                        <button key={f} onClick={()=>setFillColor(f)} style={{ width:18, height:18, borderRadius:4, background:f==='none'?'linear-gradient(135deg,#111 45%,#f87171 45%)':f, border:fillColor===f?'2px solid #3b82f6':'2px solid rgba(255,255,255,0.08)', cursor:'pointer' }}/>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ width:1, height:24, background:'rgba(255,255,255,0.06)' }}/>
                {/* Size */}
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:10, color:'#1e3a5f' }}>Size</span>
                  <button className="btn-icon" style={{ padding:4 }} onClick={()=>setBrushSize(s=>Math.max(1,s-1))}>-</button>
                  <span style={{ fontFamily:'monospace', fontSize:13, color:'#64748b', minWidth:20, textAlign:'center' }}>{brushSize}</span>
                  <button className="btn-icon" style={{ padding:4 }} onClick={()=>setBrushSize(s=>Math.min(40,s+1))}>+</button>
                </div>
                <div style={{ width:1, height:24, background:'rgba(255,255,255,0.06)' }}/>
                <button className="btn-icon" title="Undo" onClick={undo}><RotateCcw size={14}/></button>
                <button className="btn-icon" title="Redo" onClick={redo}><RotateCw size={14}/></button>
                <button className="btn-icon" title="Clear" onClick={()=>clearCanvas(true)} style={{ color:'#f87171' }}><Trash2 size={14}/></button>
                <button className="btn-icon" title="Export PNG" onClick={exportWB}><Download size={14}/></button>
                <div style={{ marginLeft:'auto', fontSize:11, color:'#1e3a5f', display:'flex', alignItems:'center', gap:5 }}>
                  <div className="pulse-dot"/> Live • {members.length} online
                </div>
              </div>

              {/* Canvas */}
              <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
                <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block', cursor:tool==='text'?'text':tool==='eraser'?'cell':'crosshair' }}
                  onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
                  onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}/>
                {/* Text input overlay */}
                {textPos && (
                  <div style={{ position:'absolute', top:textPos.y - fontSize, left:textPos.x, zIndex:10 }}>
                    <input autoFocus value={textVal} onChange={e=>setTextVal(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter') placeText(); if(e.key==='Escape') setTextPos(null) }}
                      onBlur={placeText}
                      style={{ background:'rgba(7,11,20,0.9)', border:'1px dashed #3b82f6', color, fontSize, fontFamily:'Inter,sans-serif', outline:'none', padding:'2px 8px', borderRadius:6, minWidth:80 }}
                      placeholder="Type…"/>
                    <p style={{ fontSize:10, color:'#3d5a7a', marginTop:2 }}>Enter = place · Esc = cancel</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CHAT / FILES / MEMBERS PANEL ─────────────────── */}
          {panel === 'room' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0, background:'rgba(7,11,20,0.95)' }}>
                {[['chat','💬 Chat'],['files','📁 Files'],['members','👥 Members']].map(([t,l]) => (
                  <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 18px', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:'transparent', fontFamily:'Inter,sans-serif',
                    color: tab===t ? '#60a5fa' : '#1e3a5f',
                    borderBottom: tab===t ? '2px solid #3b82f6' : '2px solid transparent', transition:'all 0.15s' }}>
                    {l}
                  </button>
                ))}
              </div>

              {/* CHAT */}
              {tab === 'chat' && (
                <>
                  <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:6 }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'48px 0', color:'#1e3a5f' }}>
                        <MessageSquare size={36} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
                        <p style={{ fontSize:13 }}>Start the study session!</p>
                      </div>
                    ) : messages.map((m, i) => {
                      const isMe = m.user_id === user.id
                      const showName = !isMe && (i===0 || messages[i-1].sender_name !== m.sender_name)
                      return (
                        <div key={m.id} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start' }}>
                          <div style={{ maxWidth:380, display:'flex', flexDirection:'column', alignItems:isMe?'flex-end':'flex-start', gap:2 }}>
                            {showName && <span style={{ fontSize:11, color:'#3d5a7a', fontWeight:600, paddingLeft:5 }}>{m.sender_name}</span>}
                            <div style={{ padding:'9px 14px', borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px', fontSize:13, lineHeight:1.55,
                              background:m.type==='file'?'rgba(255,255,255,0.03)':isMe?'#1d4ed8':'rgba(255,255,255,0.05)',
                              color:'#e2e8f0', border:`1px solid ${m.type==='file'?'rgba(255,255,255,0.07)':isMe?'transparent':'rgba(255,255,255,0.07)'}` }}>
                              {m.type==='file' ? (
                                <a href={m.file_url} target="_blank" rel="noreferrer" style={{ color:'#60a5fa', textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
                                  <FileText size={14}/>{m.file_name||m.text}
                                  <ExternalLink size={11}/>
                                </a>
                              ) : m.text}
                            </div>
                            <span style={{ fontSize:10, color:'#1e3a5f' }}>{format(new Date(m.created_at),'h:mm a')}</span>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={msgEndRef}/>
                  </div>
                  <form onSubmit={sendMsg} style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:8, flexShrink:0, background:'rgba(7,11,20,0.95)', alignItems:'center' }}>
                    <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleFile}/>
                    <button type="button" className="btn-secondary" style={{ padding:'9px 12px', flexShrink:0 }} onClick={()=>fileInputRef.current?.click()} title="Share file" disabled={uploading}>
                      {uploading ? <div style={{ width:14, height:14, border:'2px solid #3b82f6', borderTop:'2px solid transparent', borderRadius:'50%' }} className="spin"/> : <Plus size={15}/>}
                    </button>
                    <input className="input" placeholder="Message…" value={msg} onChange={e=>setMsg(e.target.value)} autoComplete="off" style={{ flex:1 }}/>
                    <button type="submit" className="btn-primary" style={{ padding:'9px 16px', flexShrink:0 }} disabled={!msg.trim()}>
                      <Send size={15}/>
                    </button>
                  </form>
                </>
              )}

              {/* FILES */}
              {tab === 'files' && (
                <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:'#e2e8f0' }}>Shared Files ({files.length})</h3>
                    <button className="btn-primary" style={{ fontSize:12, padding:'7px 12px' }} onClick={()=>fileInputRef.current?.click()} disabled={uploading}>
                      <Plus size={13}/> Upload
                    </button>
                    <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleFile}/>
                  </div>
                  {files.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'48px 0', color:'#1e3a5f' }}>
                      <FolderOpen size={36} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
                      <p style={{ fontSize:13 }}>No files yet</p>
                      <p style={{ fontSize:11, marginTop:4 }}>Share PDFs, Word docs, images with your study group</p>
                    </div>
                  ) : files.map(f => (
                    <div key={f.id} className="table-row" style={{ marginBottom:8, justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <FileIcon type={f.type}/>
                        </div>
                        <div>
                          <p style={{ fontSize:13, fontWeight:500, color:'#e2e8f0' }}>{f.name}</p>
                          <p style={{ fontSize:11, color:'#1e3a5f' }}>{fmtSize(f.size)} · by {f.uploaded_by} · {format(new Date(f.created_at),'MMM d')}</p>
                        </div>
                      </div>
                      <a href={f.url} target="_blank" rel="noreferrer" download>
                        <button className="btn-secondary" style={{ fontSize:12, padding:'6px 12px' }}>
                          <Download size={13}/> Download
                        </button>
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* MEMBERS */}
              {tab === 'members' && (
                <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
                  <div style={{ background:'rgba(37,99,235,0.07)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
                    <p style={{ fontSize:12, color:'#3d5a7a', marginBottom:8 }}>Invite friends with room code:</p>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:'monospace', fontSize:28, fontWeight:800, color:'#60a5fa', letterSpacing:6 }}>{activeRoom.code}</span>
                      <button className="btn-secondary" style={{ fontSize:12, padding:'7px 12px' }} onClick={()=>setShareModal(true)}>
                        <Share2 size={13}/> Share
                      </button>
                    </div>
                  </div>
                  <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14, color:'#e2e8f0', marginBottom:10 }}>
                    Members ({members.length})
                  </h3>
                  {members.map((m, i) => (
                    <div key={i} className="table-row" style={{ marginBottom:6 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>
                        {(m.profiles?.name||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{m.profiles?.name||'Unknown'}</p>
                        {m.profiles?.branch && <p style={{ fontSize:11, color:'#1e3a5f' }}>{m.profiles.branch}</p>}
                      </div>
                      {m.user_id === activeRoom.created_by && (
                        <span style={{ fontSize:10, color:'#fbbf24', background:'rgba(251,191,36,0.1)', padding:'2px 8px', borderRadius:5 }}>Host</span>
                      )}
                      <div className="pulse-dot"/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Create Room Modal ────────────────────────────────── */}
      <Modal open={createModal} onClose={()=>setCreateModal(false)} title="Create Study Room" maxW={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label className="label">Room Name *</label><input className="input" placeholder="e.g. DBMS Exam Prep" value={newRoom.name} onChange={e=>setNewRoom(p=>({...p,name:e.target.value}))} autoFocus onKeyDown={e=>e.key==='Enter'&&handleCreate()}/></div>
          <div><label className="label">Subject (optional)</label><input className="input" placeholder="e.g. Database Management" value={newRoom.subject} onChange={e=>setNewRoom(p=>({...p,subject:e.target.value}))}/></div>
          <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.12)', borderRadius:10, padding:'10px 14px' }}>
            <p style={{ fontSize:12, color:'#3d5a7a' }}>A 6-character code will be generated. Share it with friends to collaborate in real-time on the whiteboard, chat, and files.</p>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <button className="btn-secondary" onClick={()=>setCreateModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate}>Create Room</button>
          </div>
        </div>
      </Modal>

      {/* ── Share Modal ──────────────────────────────────────── */}
      {activeRoom && (
        <Modal open={shareModal} onClose={()=>setShareModal(false)} title="Share Room" maxW={400}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ textAlign:'center', padding:'10px 0' }}>
              <p style={{ fontSize:11, color:'#3d5a7a', marginBottom:8 }}>Room Code</p>
              <p style={{ fontFamily:'monospace', fontSize:36, fontWeight:800, color:'#60a5fa', letterSpacing:8 }}>{activeRoom.code}</p>
            </div>
            <div>
              <label className="label">Room Link</label>
              <div style={{ display:'flex', gap:6 }}>
                <input className="input" value={roomUrl(activeRoom.code)} readOnly style={{ flex:1, fontSize:12 }}/>
                <button className="btn-secondary" style={{ padding:'9px 12px', flexShrink:0 }} onClick={()=>shareVia('copy', roomUrl(activeRoom.code), '')}>
                  <Copy size={14}/>
                </button>
              </div>
            </div>
            <div>
              <label className="label">Share via</label>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>shareVia('whatsapp', roomUrl(activeRoom.code), `Join my StudyOne room "${activeRoom.name}"!`)}
                  style={{ flex:1, padding:'10px 0', borderRadius:11, border:'1px solid rgba(37,211,102,0.25)', background:'rgba(37,211,102,0.08)', color:'#4ade80', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  📱 WhatsApp
                </button>
                <button onClick={()=>shareVia('telegram', roomUrl(activeRoom.code), `Join my StudyOne room "${activeRoom.name}"!`)}
                  style={{ flex:1, padding:'10px 0', borderRadius:11, border:'1px solid rgba(0,136,204,0.25)', background:'rgba(0,136,204,0.08)', color:'#38bdf8', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  ✈️ Telegram
                </button>
                <button onClick={()=>shareVia('copy', roomUrl(activeRoom.code), '')}
                  style={{ flex:1, padding:'10px 0', borderRadius:11, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'#94a3b8', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  🔗 Copy Link
                </button>
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px' }}>
              <p style={{ fontSize:12, color:'#3d5a7a' }}>Friends can join by opening the link, or by entering the code <strong style={{color:'#60a5fa'}}>{activeRoom.code}</strong> in Study Rooms.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
