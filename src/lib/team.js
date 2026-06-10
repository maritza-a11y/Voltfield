import { supabase } from './supabase'

export async function getTeamMembers() {
  return supabase.from('team_members').select('*').order('invited_at', { ascending: false })
}

export async function inviteTeamMember(email, fullName, role) {
  return supabase
    .from('team_members')
    .insert({ email, full_name: fullName, role })
    .select()
    .single()
}

export async function updateTeamMember(id, updates) {
  return supabase.from('team_members').update(updates).eq('id', id).select().single()
}

export async function removeTeamMember(id) {
  return supabase.from('team_members').delete().eq('id', id)
}
