import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout      from './components/layout/Layout'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Notes       from './pages/Notes'
import Assignments from './pages/Assignments'
import Expenses    from './pages/Expenses'
import Timetable   from './pages/Timetable'
import Attendance  from './pages/Attendance'
import Flashcards  from './pages/Flashcards'
import TimerPage   from './pages/TimerPage'
import StudyRoom   from './pages/StudyRoom'
import Analytics   from './pages/Analytics'
import Profile     from './pages/Profile'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#070b14'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:44,height:44,border:'3px solid rgba(59,130,246,0.3)',borderTop:'3px solid #3b82f6',borderRadius:'50%',margin:'0 auto 16px'}} className="spin"/>
        <p style={{color:'#3d5a7a',fontSize:14}}>Loading StudyOne…</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/room/:code" element={<Guard><StudyRoom /></Guard>} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="notes"       element={<Notes />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="expenses"    element={<Expenses />} />
            <Route path="timetable"   element={<Timetable />} />
            <Route path="attendance"  element={<Attendance />} />
            <Route path="flashcards"  element={<Flashcards />} />
            <Route path="timer"       element={<TimerPage />} />
            <Route path="studyroom"   element={<StudyRoom />} />
            <Route path="studyroom/:code" element={<StudyRoom />} />
            <Route path="analytics"   element={<Analytics />} />
            <Route path="profile"     element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
