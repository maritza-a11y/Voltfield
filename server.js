import express from 'express'
import pg from 'pg'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 8080

// ── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
})

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── File uploads ─────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      const dir = path.join(uploadsDir, req.params.jobId, req.params.section)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename(_req, file, cb) {
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      cb(null, `${Date.now()}-${safe}`)
    },
  }),
})

app.use('/uploads', express.static(uploadsDir))

// ── Helper ───────────────────────────────────────────────────────────────────
const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// JOBS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/jobs', handle(async (req, res) => {
  const { search, city, status, job_type, from_date, to_date } = req.query
  const params = []
  let where = 'WHERE 1=1'

  if (search) {
    params.push(`%${search}%`)
    where += ` AND (client_name ILIKE $${params.length}
                OR address ILIKE $${params.length}
                OR job_number ILIKE $${params.length}
                OR city ILIKE $${params.length})`
  }
  if (city)      { params.push(city);                    where += ` AND city = $${params.length}` }
  if (status)    { params.push(status);                  where += ` AND status = $${params.length}` }
  if (job_type)  { params.push(job_type);                where += ` AND job_type = $${params.length}` }
  if (from_date) { params.push(from_date);               where += ` AND created_at >= $${params.length}` }
  if (to_date)   { params.push(to_date + 'T23:59:59');   where += ` AND created_at <= $${params.length}` }

  const { rows } = await pool.query(`SELECT * FROM jobs ${where} ORDER BY created_at DESC`, params)
  res.json(rows)
}))

app.get('/api/jobs/:id', handle(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Job not found' })
  res.json(rows[0])
}))

app.post('/api/jobs', handle(async (req, res) => {
  const { client_name, address, city, job_type, status = 'Active', notes, lat, lng } = req.body
  const { rows } = await pool.query(
    `INSERT INTO jobs (client_name, address, city, job_type, status, notes, lat, lng)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [client_name, address, city, job_type, status, notes ?? null, lat ?? null, lng ?? null],
  )
  res.status(201).json(rows[0])
}))

app.put('/api/jobs/:id', handle(async (req, res) => {
  const { client_name, address, city, job_type, status, notes, lat, lng } = req.body
  const { rows } = await pool.query(
    `UPDATE jobs
     SET client_name=$1, address=$2, city=$3, job_type=$4, status=$5,
         notes=$6, lat=$7, lng=$8, updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [client_name, address, city, job_type, status, notes ?? null,
     lat ?? null, lng ?? null, req.params.id],
  )
  if (!rows.length) return res.status(404).json({ error: 'Job not found' })
  res.json(rows[0])
}))

app.delete('/api/jobs/:id', handle(async (req, res) => {
  await pool.query('DELETE FROM jobs WHERE id = $1', [req.params.id])
  res.json({ success: true })
}))

// Dashboard stats
app.get('/api/stats', handle(async (_req, res) => {
  const [jobsRes, filesRes] = await Promise.all([
    pool.query('SELECT status FROM jobs'),
    pool.query('SELECT section FROM job_files'),
  ])
  const jobs  = jobsRes.rows
  const files = filesRes.rows
  res.json({
    total:     jobs.length,
    active:    jobs.filter((j) => j.status === 'Active').length,
    completed: jobs.filter((j) => j.status === 'Completed').length,
    onHold:    jobs.filter((j) => j.status === 'On Hold').length,
    photos:    files.filter((f) => f.section === 'photos').length,
    invoices:  files.filter((f) => f.section === 'invoices').length,
    contracts: files.filter((f) => f.section === 'contracts').length,
    permits:   files.filter((f) => f.section === 'permits').length,
  })
}))

// ════════════════════════════════════════════════════════════════════════════
// JOB FILES
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/jobs/:jobId/files', handle(async (req, res) => {
  const { section } = req.query
  const params = [req.params.jobId]
  let where = 'WHERE job_id = $1'
  if (section) { params.push(section); where += ` AND section = $${params.length}` }
  const { rows } = await pool.query(
    `SELECT * FROM job_files ${where} ORDER BY uploaded_at DESC`, params,
  )
  res.json(rows)
}))

app.post('/api/jobs/:jobId/files/:section', upload.single('file'), handle(async (req, res) => {
  const { jobId, section } = req.params
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file uploaded' })

  const exif = req.body.exif ? JSON.parse(req.body.exif) : null
  const storagePath = `${jobId}/${section}/${file.filename}`

  const { rows } = await pool.query(
    `INSERT INTO job_files
       (job_id, section, file_name, storage_path, file_size, mime_type,
        photo_lat, photo_lng, exif_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [jobId, section, file.originalname, storagePath,
     file.size, file.mimetype,
     exif?.lat ?? null, exif?.lng ?? null,
     exif ? JSON.stringify(exif) : null],
  )
  res.status(201).json(rows[0])
}))

app.delete('/api/job-files/:id', handle(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT storage_path FROM job_files WHERE id = $1', [req.params.id],
  )
  if (rows.length) {
    const fp = path.join(uploadsDir, rows[0].storage_path)
    if (fs.existsSync(fp)) fs.unlinkSync(fp)
  }
  await pool.query('DELETE FROM job_files WHERE id = $1', [req.params.id])
  res.json({ success: true })
}))

// All files across jobs (documents page)
app.get('/api/job-files', handle(async (req, res) => {
  const { section, job_id, from, to } = req.query
  const params = []
  let where = 'WHERE 1=1'

  if (section) { params.push(section); where += ` AND jf.section = $${params.length}` }
  if (job_id)  { params.push(job_id);  where += ` AND jf.job_id = $${params.length}` }
  if (from)    { params.push(from);    where += ` AND jf.uploaded_at >= $${params.length}` }
  if (to)      { params.push(to + 'T23:59:59'); where += ` AND jf.uploaded_at <= $${params.length}` }

  const { rows } = await pool.query(
    `SELECT jf.*,
       CASE WHEN j.id IS NOT NULL
         THEN json_build_object('job_number', j.job_number, 'client_name', j.client_name)
         ELSE NULL
       END AS jobs
     FROM job_files jf
     LEFT JOIN jobs j ON jf.job_id = j.id
     ${where}
     ORDER BY jf.uploaded_at DESC`,
    params,
  )
  res.json(rows)
}))

// ════════════════════════════════════════════════════════════════════════════
// TEAM MEMBERS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/team-members', handle(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM team_members ORDER BY invited_at DESC')
  res.json(rows)
}))

app.post('/api/team-members', handle(async (req, res) => {
  const { email, full_name, role = 'Technician' } = req.body
  const { rows } = await pool.query(
    'INSERT INTO team_members (email, full_name, role) VALUES ($1,$2,$3) RETURNING *',
    [email, full_name ?? null, role],
  )
  res.status(201).json(rows[0])
}))

app.put('/api/team-members/:id', handle(async (req, res) => {
  const fields = Object.entries(req.body)
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
  const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const vals = fields.map(([, v]) => v)
  vals.push(req.params.id)
  const { rows } = await pool.query(
    `UPDATE team_members SET ${set} WHERE id = $${vals.length} RETURNING *`, vals,
  )
  if (!rows.length) return res.status(404).json({ error: 'Member not found' })
  res.json(rows[0])
}))

app.delete('/api/team-members/:id', handle(async (req, res) => {
  await pool.query('DELETE FROM team_members WHERE id = $1', [req.params.id])
  res.json({ success: true })
}))

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/notifications', handle(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 60',
  )
  res.json(rows)
}))

app.post('/api/notifications', handle(async (req, res) => {
  const { message, job_id, job_number } = req.body
  const { rows } = await pool.query(
    'INSERT INTO notifications (message, job_id, job_number) VALUES ($1,$2,$3) RETURNING *',
    [message, job_id ?? null, job_number ?? null],
  )
  res.status(201).json(rows[0])
}))

app.patch('/api/notifications/:id/read', handle(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE notifications SET read=true WHERE id=$1 RETURNING *', [req.params.id],
  )
  res.json(rows[0])
}))

app.patch('/api/notifications/read-all', handle(async (_req, res) => {
  await pool.query("UPDATE notifications SET read=true WHERE read=false")
  res.json({ success: true })
}))

// ════════════════════════════════════════════════════════════════════════════
// Serve React frontend (must be last)
// ════════════════════════════════════════════════════════════════════════════

const distDir = path.join(__dirname, 'dist')

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
} else {
  app.get('/', (_req, res) => res.send('API running — run `npm run build` to serve the frontend.'))
}

app.listen(PORT, () => console.log(`VoltField server running on port ${PORT}`))
