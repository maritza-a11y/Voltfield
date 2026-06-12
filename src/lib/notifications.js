async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(path, opts)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { data: null, error: { message: json.error ?? res.statusText } }
  return { data: json, error: null }
}

export async function getNotifications() {
  return api('GET', '/api/notifications')
}

export async function createNotification(message, jobId, jobNumber) {
  return api('POST', '/api/notifications', { message, job_id: jobId ?? null, job_number: jobNumber ?? null })
}

export async function markRead(id) {
  return api('PATCH', `/api/notifications/${id}/read`)
}

export async function markAllRead() {
  return api('PATCH', '/api/notifications/read-all')
}
