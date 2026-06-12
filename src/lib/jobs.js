// All data access goes through the Express backend at /api.
// Functions return { data, error } to keep the same shape callers expect.

async function api(method, path, body) {
  const opts = { method, headers: {} }
  if (body && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  } else if (body) {
    opts.body = body
  }
  const res = await fetch(path, opts)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { data: null, error: { message: json.error ?? res.statusText } }
  return { data: json, error: null }
}

export async function getJobs(filters = {}) {
  const params = new URLSearchParams()
  if (filters.search)    params.set('search',    filters.search)
  if (filters.city)      params.set('city',       filters.city)
  if (filters.status)    params.set('status',     filters.status)
  if (filters.job_type)  params.set('job_type',   filters.job_type)
  if (filters.from_date) params.set('from_date',  filters.from_date)
  if (filters.to_date)   params.set('to_date',    filters.to_date)
  const qs = params.toString()
  return api('GET', `/api/jobs${qs ? '?' + qs : ''}`)
}

export async function getJob(id) {
  return api('GET', `/api/jobs/${id}`)
}

export async function createJob(job) {
  return api('POST', '/api/jobs', job)
}

export async function updateJob(id, updates) {
  return api('PUT', `/api/jobs/${id}`, updates)
}

export async function deleteJob(id) {
  return api('DELETE', `/api/jobs/${id}`)
}

export async function getJobFiles(jobId, section) {
  const qs = section ? `?section=${section}` : ''
  return api('GET', `/api/jobs/${jobId}/files${qs}`)
}

export async function getAllFiles(filters = {}) {
  const params = new URLSearchParams()
  if (filters.section) params.set('section', filters.section)
  if (filters.job_id)  params.set('job_id',  filters.job_id)
  if (filters.from)    params.set('from',    filters.from)
  if (filters.to)      params.set('to',      filters.to)
  const qs = params.toString()
  return api('GET', `/api/job-files${qs ? '?' + qs : ''}`)
}

export async function uploadJobFile(jobId, section, file, exifData = null) {
  const form = new FormData()
  form.append('file', file)
  if (exifData) form.append('exif', JSON.stringify(exifData))
  return api('POST', `/api/jobs/${jobId}/files/${section}`, form)
}

export async function deleteJobFile(fileId, _storagePath) {
  return api('DELETE', `/api/job-files/${fileId}`)
}

export function getPublicUrl(storagePath) {
  return `/uploads/${storagePath}`
}

export async function getDashboardStats() {
  const { data, error } = await api('GET', '/api/stats')
  // Return the stats object directly (not wrapped) so callers can use it as-is.
  return data ?? { total: 0, active: 0, completed: 0, onHold: 0, photos: 0, invoices: 0, contracts: 0, permits: 0 }
}
