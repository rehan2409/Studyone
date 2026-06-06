import React, { useState, useRef, useEffect } from 'react'

const DEFAULT_SUBJECTS = [
  'DBMS', 'Computer Networks', 'Software Engineering',
  'Operating Systems', 'Blockchain', 'Mathematics',
  'Data Structures', 'Algorithms', 'Machine Learning',
  'Web Development', 'Computer Architecture', 'Theory of Computation',
  'Compiler Design', 'Artificial Intelligence', 'Other'
]

export default function SubjectInput({ value, onChange, placeholder = 'Type or select subject' }) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState(value || '')
  const ref = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = DEFAULT_SUBJECTS.filter(s =>
    s.toLowerCase().includes(query.toLowerCase())
  )

  const select = (s) => {
    setQuery(s)
    onChange(s)
    setOpen(false)
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (filtered.length > 0 || query.trim()) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#0d1220', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 12, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          maxHeight: 220, overflowY: 'auto'
        }}>
          {query.trim() && !DEFAULT_SUBJECTS.find(s => s.toLowerCase() === query.toLowerCase()) && (
            <button
              onMouseDown={() => select(query)}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px',
                background:'rgba(37,99,235,0.1)', border:'none', cursor:'pointer',
                color:'#60a5fa', fontSize:13, fontFamily:'Inter,sans-serif', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:11, background:'rgba(37,99,235,0.2)', padding:'2px 7px', borderRadius:4 }}>ADD</span>
              "{query}"
            </button>
          )}
          {filtered.map(s => (
            <button key={s} onMouseDown={() => select(s)}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 14px',
                background: value===s ? 'rgba(37,99,235,0.15)' : 'transparent',
                border:'none', cursor:'pointer', color: value===s ? '#60a5fa' : '#94a3b8',
                fontSize:13, fontFamily:'Inter,sans-serif', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background=value===s?'rgba(37,99,235,0.15)':'transparent'}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
