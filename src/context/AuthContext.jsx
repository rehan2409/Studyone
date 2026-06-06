import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

// Ensure profile row exists - called before any DB write
export async function ensureProfile(user) {
  if (!user) return null
  const { data: existing } = await supabase
    .from('profiles').select('id').eq('id', user.id).single()
  if (existing) return existing
  // Create minimal profile from auth user
  const { data } = await supabase.from('profiles').upsert({
    id: user.id,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Student',
    email: user.email,
    college: '', branch: '', year: '', cgpa: ''
  }).select().single()
  return data
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await ensureProfile(u)
        await fetchProfile(u.id)
      } else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await ensureProfile(u)
        await fetchProfile(u.id)
      } else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setLoading(false)
  }

  const register = async ({ name, email, password, college, branch, year, cgpa }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    })
    if (error) throw new Error(error.message)
    if (data.user) {
      // Upsert profile immediately after signup
      await supabase.from('profiles').upsert({
        id: data.user.id, name, email, college, branch, year, cgpa
      })
      await fetchProfile(data.user.id)
    }
    return data.user
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    // Always ensure profile exists on login
    await ensureProfile(data.user)
    await fetchProfile(data.user.id)
    return data.user
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
    toast.success('Logged out')
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase.from('profiles')
      .update(updates).eq('id', user.id).select().single()
    if (error) throw new Error(error.message)
    setProfile(data)
    toast.success('Profile updated ✓')
    return data
  }

  return (
    <Ctx.Provider value={{ user, profile, loading, register, login, logout, updateProfile }}>
      {children}
    </Ctx.Provider>
  )
}
