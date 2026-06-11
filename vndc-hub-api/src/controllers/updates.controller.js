import { query } from '../config/db.js'

// GET /api/updates
export async function getTasks(req, res, next) {
  try {
    const { status } = req.query
    const isAdmin = req.user.role === 'admin'

    let sql = `
      SELECT t.*, u.name as creator_name
      FROM update_tasks t
      LEFT JOIN users u ON u.id = t.created_by
      WHERE 1=1
    `
    const params = []

    // Member chỉ xem tasks của mình
    if (!isAdmin) {
      params.push(req.user.id)
      sql += ` AND t.created_by = $${params.length}`
    }

    if (status && status !== 'all') {
      params.push(status)
      sql += ` AND t.status = $${params.length}`
    }

    sql += ' ORDER BY t.created_at DESC'
    const { rows } = await query(sql, params)
    res.json({ tasks: rows, total: rows.length })
  } catch (err) { next(err) }
}

// POST /api/updates — Tạo task mới
export async function createTask(req, res, next) {
  try {
    const { name, department = 'Chung', audience = ['all'] } = req.body
    const file = req.file
    const isAdmin = req.user.role === 'admin'

    if (!name?.trim())
      return res.status(400).json({ error: 'Tên tài liệu là bắt buộc' })

    const audienceArr = Array.isArray(audience)
      ? audience : JSON.parse(audience)

    // Admin → approved ngay, member → pending chờ duyệt
    const status = isAdmin ? 'approved' : 'pending'
    const progress = isAdmin ? 100 : 0

    const { rows } = await query(`
      INSERT INTO update_tasks
        (name, file_name, department, audience, status, progress, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [
      name.trim(),
      file?.originalname || null,
      department,
      audienceArr,
      status,
      progress,
      req.user.id
    ])

    // Nếu admin upload → tạo document luôn
    if (isAdmin && file) {
      const { detectFileType, formatFileSize } = await import('../middleware/upload.js')
      const type = detectFileType(file.mimetype)
      const size = formatFileSize(file.size)
      const filePath = `documents/${file.filename}`
      const fileUrl = `/uploads/documents/${file.filename}`

      await query(
        `INSERT INTO documents
          (name, type, department, audience, version, size,
           file_path, file_url, tag, uploaded_by)
         VALUES ($1,$2,$3,$4,'v1.0',$5,$6,$7,$8,$9)`,
        [name.trim(), type, department, audienceArr,
         size, filePath, fileUrl, 'quy-trinh', req.user.id]
      )
    }

    // Nếu member upload → thông báo cho admin
    if (!isAdmin) {
      await query(`
        INSERT INTO notifications (text, icon, link)
        VALUES ($1,$2,$3)
      `, [
        `"${name}" cần được duyệt — upload bởi ${req.user.name}`,
        'Upload', '/updates'
      ])
    }

    await query(
      `INSERT INTO activity_logs (action,entity_type,entity_name,user_id)
       VALUES ($1,$2,$3,$4)`,
      ['Tải lên tài liệu', 'update_task', name, req.user.id]
    )

    res.status(201).json({ task: rows[0] })
  } catch (err) { next(err) }
}

// PUT /api/updates/:id/approve — Duyệt phát hành
export async function approveTask(req, res, next) {
  try {
    const { rows: existing } = await query(
      'SELECT * FROM update_tasks WHERE id=$1', [req.params.id]
    )
    if (!existing[0])
      return res.status(404).json({ error: 'Task không tồn tại' })

    // Update task status
    const { rows } = await query(`
      UPDATE update_tasks
      SET status='approved', progress=100, updated_at=NOW()
      WHERE id=$1 RETURNING *
    `, [req.params.id])

    const task = rows[0]

    // Tạo document thật trong bảng documents
    // Kiểm tra chưa tạo trước đó (tránh duplicate)
    const { rows: existing_doc } = await query(
      'SELECT id FROM documents WHERE name=$1 AND uploaded_by=$2',
      [task.name, req.user.id]
    )

    if (existing_doc.length === 0) {
      await query(`
        INSERT INTO documents
          (name, type, department, audience, version,
           file_path, file_url, size, tag, uploaded_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, [
        task.name,
        detectTypeFromFilename(task.file_name),
        task.department || 'Chung',
        task.audience || ['all'],
        'v1.0',
        null,
        null,
        task.file_name ? '—' : '—',
        'quy-trinh',
        req.user.id
      ])
    }

    // Helper detect type từ filename
    function detectTypeFromFilename(filename) {
      if (!filename) return 'Module'
      const ext = filename.split('.').pop().toLowerCase()
      if (['pdf','doc','docx'].includes(ext)) return 'PDF'
      if (['xlsx','xls','csv'].includes(ext)) return 'Excel'
      if (['mp4','mov','avi'].includes(ext)) return 'Video'
      return 'Module'
    }

    // Tạo notification
    await query(`
      INSERT INTO notifications (text, icon, link)
      VALUES ($1,$2,$3)
    `, [
      `Tài liệu "${task.name}" đã được duyệt và thêm vào thư viện`,
      'CheckCircle2', '/library'
    ])

    await query(
      `INSERT INTO activity_logs (action,entity_type,entity_name,user_id)
       VALUES ($1,$2,$3,$4)`,
      ['Duyệt phát hành', 'document', task.name, req.user.id]
    )

    res.json({ task })
  } catch (err) { next(err) }
}

// PUT /api/updates/:id/train-ai — Cho AI học
export async function trainAI(req, res, next) {
  try {
    const { rows: existing } = await query(
      'SELECT * FROM update_tasks WHERE id=$1', [req.params.id]
    )
    if (!existing[0])
      return res.status(404).json({ error: 'Task không tồn tại' })

    if (existing[0].status !== 'approved')
      return res.status(400).json({
        error: 'Cần duyệt phát hành trước khi cho AI học'
      })

    // Simulate processing — set reviewing
    await query(`
      UPDATE update_tasks
      SET status='reviewing', progress=60, updated_at=NOW()
      WHERE id=$1
    `, [req.params.id])

    // Simulate AI training delay (1.5s)
    await new Promise(r => setTimeout(r, 1500))

    const { rows } = await query(`
      UPDATE update_tasks
      SET status='ai_trained', progress=100, updated_at=NOW()
      WHERE id=$1 RETURNING *
    `, [req.params.id])

    await query(
      `INSERT INTO activity_logs (action,entity_type,entity_name,user_id)
       VALUES ($1,$2,$3,$4)`,
      ['Cho AI học', 'update_task', rows[0].name, req.user.id]
    )

    res.json({ task: rows[0] })
  } catch (err) { next(err) }
}

// PUT /api/updates/:id/notify — Gửi nhắc học
export async function notifyUsers(req, res, next) {
  try {
    const { rows: existing } = await query(
      'SELECT * FROM update_tasks WHERE id=$1', [req.params.id]
    )
    if (!existing[0])
      return res.status(404).json({ error: 'Task không tồn tại' })

    const { rows } = await query(`
      UPDATE update_tasks
      SET status='notified', updated_at=NOW()
      WHERE id=$1 RETURNING *
    `, [req.params.id])

    // Tạo notification cho từng audience
    await query(`
      INSERT INTO notifications (text, icon, link)
      VALUES ($1, $2, $3)
    `, [
      `Nhắc học: "${rows[0].name}" — vui lòng xem tài liệu mới`,
      'BellRing', '/library'
    ])

    await query(
      `INSERT INTO activity_logs (action,entity_type,entity_name,user_id)
       VALUES ($1,$2,$3,$4)`,
      ['Gửi nhắc học', 'update_task', rows[0].name, req.user.id]
    )

    res.json({
      task: rows[0],
      message: `Đã gửi thông báo tới ${rows[0].audience.join(', ')}`
    })
  } catch (err) { next(err) }
}

// DELETE /api/updates/:id
export async function deleteTask(req, res, next) {
  try {
    const { rows } = await query(`
      DELETE FROM update_tasks WHERE id=$1 RETURNING name
    `, [req.params.id])

    if (!rows[0])
      return res.status(404).json({ error: 'Task không tồn tại' })

    res.json({ message: `Đã xoá: ${rows[0].name}` })
  } catch (err) { next(err) }
}
