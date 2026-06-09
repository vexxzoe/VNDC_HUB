import { query } from '../config/db.js'

// GET /api/updates
export async function getTasks(req, res, next) {
  try {
    const { status } = req.query
    let sql = `
      SELECT t.*, u.name as creator_name
      FROM update_tasks t
      LEFT JOIN users u ON u.id = t.created_by
      WHERE 1=1
    `
    const params = []
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

    if (!name?.trim())
      return res.status(400).json({ error: 'Tên tài liệu là bắt buộc' })

    const audienceArr = Array.isArray(audience)
      ? audience : JSON.parse(audience)

    const { rows } = await query(`
      INSERT INTO update_tasks
        (name, file_name, department, audience, status, progress, created_by)
      VALUES ($1, $2, $3, $4, 'pending', 0, $5)
      RETURNING *
    `, [
      name.trim(),
      file?.originalname || null,
      department,
      audienceArr,
      req.user.id
    ])

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
    const { rows } = await query(`
      UPDATE update_tasks
      SET status='approved', progress=100, updated_at=NOW()
      WHERE id=$1 RETURNING *
    `, [req.params.id])

    if (!rows[0])
      return res.status(404).json({ error: 'Task không tồn tại' })

    await query(
      `INSERT INTO activity_logs (action,entity_type,entity_name,user_id)
       VALUES ($1,$2,$3,$4)`,
      ['Duyệt phát hành', 'update_task', rows[0].name, req.user.id]
    )

    // Tạo notification broadcast
    await query(`
      INSERT INTO notifications (text, icon, link)
      VALUES ($1, $2, $3)
    `, [
      `Tài liệu "${rows[0].name}" đã được duyệt phát hành`,
      'CheckCircle2', '/library'
    ])

    res.json({ task: rows[0] })
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
