import { supabase } from './supabase'

export async function getNotifications() {
  return supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60)
}

export async function createNotification(message, jobId, jobNumber) {
  return supabase
    .from('notifications')
    .insert({ message, job_id: jobId ?? null, job_number: jobNumber ?? null })
}

export async function markRead(id) {
  return supabase.from('notifications').update({ read: true }).eq('id', id)
}

export async function markAllRead() {
  return supabase.from('notifications').update({ read: true }).eq('read', false)
}
