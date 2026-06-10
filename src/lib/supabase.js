import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  Boolean(url) && !url.includes('YOUR-PROJECT') &&
  Boolean(key) && !key.includes('your-anon')

export const supabase = isSupabaseConfigured
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')
