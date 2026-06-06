import { createClient } from '@supabase/supabase-js'

const URL = 'https://qhmkxgolpbzbdutwsvrn.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobWt4Z29scGJ6YmR1dHdzdnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDA4MTYsImV4cCI6MjA5NjExNjgxNn0.bcHO38EMrC0AcsbbA4NpxXZBVWToP23K2bf4M6vb4g4'

export const supabase = createClient(URL, KEY, {
  realtime: { params: { eventsPerSecond: 20 } }
})
