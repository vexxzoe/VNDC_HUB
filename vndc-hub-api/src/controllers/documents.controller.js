import { query } from '../config/db.js'
import { detectFileType, formatFileSize } from '../middleware/upload.js'
import fs from 'fs'
import path from 'path'

// GET /api/documents
export async function getDocuments(req, res, next) {
  try {
    const { department, type, search, bookmarked, tag } = req.query
    const user = req.user

    let sql = `
      SELECT d.*,
        CASE WHEN b.user_id IS NOT NULL THEN true ELSE false END as bookmarked
      FROM documents d
      LEFT JOIN bookmarks b ON b.document_id = d.id AND b.user_id = $1
      WHERE d.is_active = true
    `
    const params = [user.id]

    // Permission filter: member chỉ xem docs của dept mình + audience all
    if (user.role !== 'admin') {
      params.push(user.department)
      sql += ` AND (
        $${params.length} = ANY(d.audience) OR
        'all' = ANY(d.audience) OR
        d.department = $${params.length}
      )`
    }

    if (department && department !== 'all') {
      params.push(department)
      sql += ` AND d.department = $${params.length}`
    }
    if (type && type !== 'all') {
      params.push(type)
      sql += ` AND d.type = $${params.length}`
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      sql += ` AND (
        LOWER(d.name) LIKE $${params.length} OR
        LOWER(d.tag) LIKE $${params.length} OR
        LOWER(d.department) LIKE $${params.length}
      )`
    }
    if (bookmarked === 'true') {
      sql += ` AND b.user_id IS NOT NULL`
    }
    if (tag) {
      params.push(tag)
      sql += ` AND d.tag = $${params.length}`
    }

    sql += ` ORDER BY d.updated_at DESC`
    const { rows } = await query(sql, params)
    res.json({ documents: rows, total: rows.length })
  } catch (err) { next(err) }
}

// GET /api/documents/:id
export async function getDocumentById(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT d.*,
        u.name as uploader_name,
        CASE WHEN b.user_id IS NOT NULL THEN true ELSE false END as bookmarked
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       LEFT JOIN bookmarks b ON b.document_id = d.id AND b.user_id = $2
       WHERE d.id = $1 AND d.is_active = true`,
      [req.params.id, req.user.id]
    )
    if (!rows[0])
      return res.status(404).json({ error: 'Tài liệu không tồn tại' })

    // Increment view count
    await query(
      'UPDATE documents SET views = views + 1 WHERE id = $1',
      [req.params.id]
    )
    await query(
      'INSERT INTO document_views (document_id, user_id) VALUES ($1,$2)',
      [req.params.id, req.user.id]
    )

    // Get version history
    const { rows: versions } = await query(
      `SELECT * FROM document_versions
       WHERE document_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [req.params.id]
    )

    res.json({ document: rows[0], versions })
  } catch (err) { next(err) }
}

// POST /api/documents — Upload file
export async function createDocument(req, res, next) {
  try {
    const { name, department, audience, tag, version='v1.0' } = req.body
    const file = req.file

    if (!name || !department)
      return res.status(400).json({ error: 'Tên và phòng ban là bắt buộc' })

    const audienceArr = audience
      ? (Array.isArray(audience) ? audience : JSON.parse(audience))
      : ['all']

    const type = file ? detectFileType(file.mimetype) : 'Module'
    const size = file ? formatFileSize(file.size) : '—'
    const filePath = file ? `documents/${file.filename}` : null
    const fileUrl = file ? `/uploads/documents/${file.filename}` : null

    // Tạo document
    const { rows } = await query(
      `INSERT INTO documents
        (name, type, department, audience, version, tag, size,
         file_path, file_url, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [name.trim(), type, department, audienceArr,
       version, tag||null, size, filePath, fileUrl, req.user.id]
    )
    const doc = rows[0]

    // Version history
    if (file) {
      await query(
        `INSERT INTO document_versions
          (document_id, version, file_path, note, created_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [doc.id, version, filePath, 'Phiên bản đầu tiên', req.user.id]
      )
    }

    // ← MỚI: Tạo update_task tương ứng (status=approved, đã duyệt luôn)
    await query(
      `INSERT INTO update_tasks
        (name, file_name, department, audience, status, progress, created_by)
       VALUES ($1,$2,$3,$4,'approved',100,$5)`,
      [
        name.trim(),
        file?.originalname || null,
        department,
        audienceArr,
        req.user.id
      ]
    )

    await query(
      'INSERT INTO activity_logs (action,entity_type,entity_name,user_id) VALUES ($1,$2,$3,$4)',
      ['Tải lên tài liệu', 'document', name, req.user.id]
    )

    res.status(201).json({ document: doc })
  } catch (err) { next(err) }
}

// PUT /api/documents/:id
export async function updateDocument(req, res, next) {
  try {
    const { name, department, audience, tag, version } = req.body
    const file = req.file

    const { rows: existing } = await query(
      'SELECT * FROM documents WHERE id = $1', [req.params.id]
    )
    if (!existing[0])
      return res.status(404).json({ error: 'Tài liệu không tồn tại' })

    const updates = []
    const params = []

    if (name) { params.push(name.trim()); updates.push(`name=$${params.length}`) }
    if (department) { params.push(department); updates.push(`department=$${params.length}`) }
    if (audience) {
      const arr = Array.isArray(audience) ? audience : JSON.parse(audience)
      params.push(arr); updates.push(`audience=$${params.length}`)
    }
    if (tag !== undefined) { params.push(tag); updates.push(`tag=$${params.length}`) }

    if (file) {
      const filePath = `documents/${file.filename}`
      const fileUrl = `/uploads/documents/${file.filename}`
      const size = formatFileSize(file.size)
      const type = detectFileType(file.mimetype)
      const newVersion = version || 'v' + (
        parseFloat(existing[0].version?.replace('v','') || 1) + 0.1
      ).toFixed(1)

      params.push(filePath); updates.push(`file_path=$${params.length}`)
      params.push(fileUrl); updates.push(`file_url=$${params.length}`)
      params.push(size); updates.push(`size=$${params.length}`)
      params.push(type); updates.push(`type=$${params.length}`)
      params.push(newVersion); updates.push(`version=$${params.length}`)

      // Save version history
      await query(
        `INSERT INTO document_versions
          (document_id, version, file_path, note, created_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.params.id, newVersion, filePath,
         req.body.note || 'Cập nhật file', req.user.id]
      )

      // Delete old file
      if (existing[0].file_path) {
        const oldPath = path.join(
          process.cwd(), 'uploads', existing[0].file_path
        )
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
    }

    if (updates.length === 0)
      return res.status(400).json({ error: 'Không có gì để cập nhật' })

    updates.push('updated_at=NOW()')
    params.push(req.params.id)

    const { rows } = await query(
      `UPDATE documents SET ${updates.join(',')}
       WHERE id=$${params.length} RETURNING *`,
      params
    )
    res.json({ document: rows[0] })
  } catch (err) { next(err) }
}

// DELETE /api/documents/:id — Soft delete
export async function deleteDocument(req, res, next) {
  try {
    const { rows } = await query(
      `UPDATE documents SET is_active=false, updated_at=NOW()
       WHERE id=$1 RETURNING name`,
      [req.params.id]
    )
    if (!rows[0])
      return res.status(404).json({ error: 'Tài liệu không tồn tại' })

    await query(
      'INSERT INTO activity_logs (action,entity_type,entity_name,user_id) VALUES ($1,$2,$3,$4)',
      ['Xoá tài liệu', 'document', rows[0].name, req.user.id]
    )
    res.json({ message: `Đã xoá: ${rows[0].name}` })
  } catch (err) { next(err) }
}

// POST /api/documents/:id/bookmark
export async function toggleBookmark(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT * FROM bookmarks WHERE user_id=$1 AND document_id=$2',
      [req.user.id, req.params.id]
    )
    if (rows[0]) {
      await query(
        'DELETE FROM bookmarks WHERE user_id=$1 AND document_id=$2',
        [req.user.id, req.params.id]
      )
      res.json({ bookmarked: false })
    } else {
      await query(
        'INSERT INTO bookmarks (user_id,document_id) VALUES ($1,$2)',
        [req.user.id, req.params.id]
      )
      res.json({ bookmarked: true })
    }
  } catch (err) { next(err) }
}

// GET /api/documents/stats — Admin
export async function getDocumentStats(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type='PDF') as pdf,
        COUNT(*) FILTER (WHERE type='Excel') as excel,
        COUNT(*) FILTER (WHERE type='Video') as video,
        COUNT(*) FILTER (WHERE type='Module') as module,
        SUM(views) as total_views
      FROM documents WHERE is_active=true
    `)
    res.json({ stats: rows[0] })
  } catch (err) { next(err) }
}
