import { supabase } from './supabase'

export async function getJobs(filters = {}) {
  let q = supabase.from('jobs').select('*').order('created_at', { ascending: false })

  if (filters.search) {
    const s = filters.search
    q = q.or(`client_name.ilike.%${s}%,address.ilike.%${s}%,job_number.ilike.%${s}%,city.ilike.%${s}%`)
  }
  if (filters.city)      q = q.eq('city', filters.city)
  if (filters.status)    q = q.eq('status', filters.status)
  if (filters.job_type)  q = q.eq('job_type', filters.job_type)
  if (filters.from_date) q = q.gte('created_at', filters.from_date)
  if (filters.to_date)   q = q.lte('created_at', filters.to_date + 'T23:59:59')

  return q
}

export async function getJob(id) {
  return supabase.from('jobs').select('*').eq('id', id).single()
}

export async function createJob(job) {
  return supabase.from('jobs').insert(job).select().single()
}

export async function updateJob(id, updates) {
  return supabase
    .from('jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteJob(id) {
  return supabase.from('jobs').delete().eq('id', id)
}

export async function getJobFiles(jobId, section) {
  let q = supabase
    .from('job_files')
    .select('*')
    .eq('job_id', jobId)
    .order('uploaded_at', { ascending: false })
  if (section) q = q.eq('section', section)
  return q
}

export async function getAllFiles(filters = {}) {
  let q = supabase
    .from('job_files')
    .select('*, jobs(job_number, client_name)')
    .order('uploaded_at', { ascending: false })

  if (filters.section) q = q.eq('section', filters.section)
  if (filters.job_id)  q = q.eq('job_id', filters.job_id)
  if (filters.from)    q = q.gte('uploaded_at', filters.from)
  if (filters.to)      q = q.lte('uploaded_at', filters.to + 'T23:59:59')

  return q
}

export async function uploadJobFile(jobId, section, file, exifData = null) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${jobId}/${section}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('job-files')
    .upload(path, file, { upsert: false })
  if (uploadError) return { data: null, error: uploadError }

  return supabase
    .from('job_files')
    .insert({
      job_id:       jobId,
      section,
      file_name:    file.name,
      storage_path: path,
      file_size:    file.size,
      mime_type:    file.type,
      photo_lat:    exifData?.lat ?? null,
      photo_lng:    exifData?.lng ?? null,
      exif_data:    exifData ?? null,
    })
    .select()
    .single()
}

export async function deleteJobFile(fileId, storagePath) {
  await supabase.storage.from('job-files').remove([storagePath])
  return supabase.from('job_files').delete().eq('id', fileId)
}

export function getPublicUrl(storagePath) {
  const { data } = supabase.storage.from('job-files').getPublicUrl(storagePath)
  return data.publicUrl
}

export async function getDashboardStats() {
  const [jobsRes, filesRes] = await Promise.all([
    supabase.from('jobs').select('status'),
    supabase.from('job_files').select('section'),
  ])

  const jobs = jobsRes.data ?? []
  const files = filesRes.data ?? []

  return {
    total:     jobs.length,
    active:    jobs.filter((j) => j.status === 'Active').length,
    completed: jobs.filter((j) => j.status === 'Completed').length,
    onHold:    jobs.filter((j) => j.status === 'On Hold').length,
    photos:    files.filter((f) => f.section === 'photos').length,
    invoices:  files.filter((f) => f.section === 'invoices').length,
    contracts: files.filter((f) => f.section === 'contracts').length,
    permits:   files.filter((f) => f.section === 'permits').length,
  }
}
