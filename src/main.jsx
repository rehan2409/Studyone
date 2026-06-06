import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{
      style:{ background:'#0d1220', color:'#e2e8f0', border:'1px solid rgba(255,255,255,0.09)', borderRadius:12, fontSize:13 },
      success:{ iconTheme:{ primary:'#4ade80', secondary:'#070b14' } },
      error:  { iconTheme:{ primary:'#f87171', secondary:'#070b14' } },
      duration: 3000
    }}/>
  </React.StrictMode>
)
