import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ensureProfile } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useTable(table, { orderBy = 'created_at', ascending = false } = {}) {
  const { user } = useAuth()
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    let q = supabase.from(table).select('*').eq('user_id', user.id)
    if (orderBy) q = q.order(orderBy, { ascending })
    const { data: rows, error } = await q
    if (!error) setData(rows || [])
    setLoading(false)
  }, [user?.id, table])

  useEffect(() => { fetch() }, [fetch])

  const insert = async (row) => {
    if (!user) throw new Error('Not logged in')
    // Ensure profile exists before every insert (fixes foreign key error)
    await ensureProfile(user)
    const { data: r, error } = await supabase
      .from(table)
      .insert({ ...row, user_id: user.id })
      .select().single()
    if (error) {
      toast.error(error.message)
      throw error
    }
    setData(p => [r, ...p])
    return r
  }

  const update = async (id, row) => {
    const { data: r, error } = await supabase
      .from(table).update(row).eq('id', id).select().single()
    if (error) { toast.error(error.message); throw error }
    setData(p => p.map(x => x.id === id ? r : x))
    return r
  }

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { toast.error(error.message); throw error }
    setData(p => p.filter(x => x.id !== id))
  }

  return { data, loading, refetch: fetch, insert, update, remove, setData }
}
