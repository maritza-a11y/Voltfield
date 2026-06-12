async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(path, opts)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { data: null, error: { message: json.error ?? res.statusText } }
  return { data: json, error: null }
}

export async function getTeamMembers() {
  return api('GET', '/api/team-members')
}

export async function inviteTeamMember(email, fullName, role) {
  return api('POST', '/api/team-members', { email, full_name: fullName, role })
}

export async function updateTeamMember(id, updates) {
  return api('PUT', `/api/team-members/${id}`, updates)
}

export async function removeTeamMember(id) {
  return api('DELETE', `/api/team-members/${id}`)
}
