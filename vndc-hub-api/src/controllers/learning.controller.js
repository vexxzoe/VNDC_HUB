import { query } from '../config/db.js'

// GET /api/modules — Lấy danh sách modules
export async function getModules(req, res, next) {
  try {
    const user = req.user
    let sql = `
      SELECT m.*,
        COALESCE(lp.progress, 0) as progress,
        lp.quiz_score,
        lp.completed_at
      FROM modules m
      LEFT JOIN learning_progress lp
        ON lp.module_id = m.id AND lp.user_id = $1
      WHERE 1=1
    `
    const params = [user.id]

    // Member chỉ xem modules của dept mình + all
    if (user.role !== 'admin') {
      params.push(user.department)
      sql += ` AND (
        'all' = ANY(m.department) OR
        $${params.length} = ANY(m.department)
      )`
    }

    sql += ' ORDER BY m.order_index ASC'
    const { rows } = await query(sql, params)
    res.json({ modules: rows })
  } catch (err) { next(err) }
}

// GET /api/modules/:id
export async function getModuleById(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT m.*,
        COALESCE(lp.progress, 0) as progress,
        lp.quiz_score, lp.completed_at
      FROM modules m
      LEFT JOIN learning_progress lp
        ON lp.module_id = m.id AND lp.user_id = $2
      WHERE m.id = $1
    `, [req.params.id, req.user.id])

    if (!rows[0])
      return res.status(404).json({ error: 'Module không tồn tại' })
    res.json({ module: rows[0] })
  } catch (err) { next(err) }
}

// PUT /api/modules/:id/progress — Cập nhật tiến độ
export async function updateProgress(req, res, next) {
  try {
    const { progress } = req.body
    if (progress === undefined || progress < 0 || progress > 100)
      return res.status(400).json({ error: 'Progress phải từ 0 đến 100' })

    const completedAt = progress === 100 ? new Date() : null

    const { rows } = await query(`
      INSERT INTO learning_progress
        (user_id, module_id, progress, completed_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, module_id)
      DO UPDATE SET
        progress = $3,
        completed_at = CASE
          WHEN $3 = 100 THEN NOW()
          ELSE learning_progress.completed_at
        END,
        updated_at = NOW()
      RETURNING *
    `, [req.user.id, req.params.id, progress, completedAt])

    res.json({ progress: rows[0] })
  } catch (err) { next(err) }
}

// GET /api/modules/:id/quiz — Lấy câu hỏi quiz
export async function getQuiz(req, res, next) {
  try {
    const { rows: module } = await query(
      'SELECT * FROM modules WHERE id = $1', [req.params.id]
    )
    if (!module[0])
      return res.status(404).json({ error: 'Module không tồn tại' })

    if (module[0].locked)
      return res.status(403).json({ error: 'Module này chưa được mở khoá' })

    const { rows } = await query(`
      SELECT id, question, options, order_index
      FROM quiz_questions
      WHERE module_id = $1
      ORDER BY order_index ASC
    `, [req.params.id])

    if (rows.length === 0)
      return res.status(404).json({ error: 'Module này chưa có quiz' })

    // KHÔNG trả answer cho client
    res.json({ questions: rows, total: rows.length })
  } catch (err) { next(err) }
}

// POST /api/modules/:id/quiz/submit — Nộp bài
export async function submitQuiz(req, res, next) {
  try {
    const { answers } = req.body
    // answers: { "questionId": answerIndex, ... }
    if (!answers || typeof answers !== 'object')
      return res.status(400).json({ error: 'Answers không hợp lệ' })

    // Lấy câu hỏi kèm đáp án đúng
    const { rows: questions } = await query(`
      SELECT id, answer FROM quiz_questions
      WHERE module_id = $1
    `, [req.params.id])

    if (questions.length === 0)
      return res.status(404).json({ error: 'Quiz không tồn tại' })

    // Chấm điểm
    let correct = 0
    questions.forEach(q => {
      if (parseInt(answers[q.id]) === q.answer) correct++
    })
    const score = Math.round(correct / questions.length * 100)
    const passed = score >= 80

    // Lưu attempt
    await query(`
      INSERT INTO quiz_attempts
        (user_id, module_id, score, answers, passed)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.id, req.params.id, score, JSON.stringify(answers), passed])

    // Cập nhật quiz_score trong learning_progress
    await query(`
      INSERT INTO learning_progress
        (user_id, module_id, progress, quiz_score, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, module_id)
      DO UPDATE SET
        quiz_score = $4,
        progress = CASE WHEN $3 >= 80 THEN 100
                        ELSE learning_progress.progress END,
        updated_at = NOW()
    `, [req.user.id, req.params.id, score, score])

    // Cấp certificate nếu đạt
    let certificate = null
    if (passed) {
      const { rows } = await query(`
        INSERT INTO certificates (user_id, module_id, score)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, module_id)
        DO UPDATE SET score = $3, issued_at = NOW()
        RETURNING *
      `, [req.user.id, req.params.id, score])
      certificate = rows[0]
    }

    res.json({ score, correct, total: questions.length, passed, certificate })
  } catch (err) { next(err) }
}

// GET /api/modules/:id/certificate
export async function getCertificate(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT c.*, m.title as module_title, m.level,
             u.name as user_name
      FROM certificates c
      JOIN modules m ON m.id = c.module_id
      JOIN users u ON u.id = c.user_id
      WHERE c.user_id = $1 AND c.module_id = $2
    `, [req.user.id, req.params.id])

    if (!rows[0])
      return res.status(404).json({ error: 'Chưa có chứng nhận cho module này' })
    res.json({ certificate: rows[0] })
  } catch (err) { next(err) }
}

// GET /api/learning/progress — Toàn bộ tiến độ của user
export async function getUserProgress(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT m.id, m.title, m.level, m.estimated_hours,
             COALESCE(lp.progress, 0) as progress,
             lp.quiz_score, lp.completed_at
      FROM modules m
      LEFT JOIN learning_progress lp
        ON lp.module_id = m.id AND lp.user_id = $1
      ORDER BY m.order_index
    `, [req.user.id])

    const total = rows.length
    const completed = rows.filter(r => r.progress === 100).length
    const avgProgress = total > 0
      ? Math.round(rows.reduce((s,r) => s + r.progress, 0) / total)
      : 0

    res.json({ modules: rows, stats: { total, completed, avgProgress } })
  } catch (err) { next(err) }
}

// GET /api/learning/videos — Video watched status
export async function getVideoStatus(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT video_id FROM video_watched WHERE user_id = $1',
      [req.user.id]
    )
    res.json({ watched: rows.map(r => r.video_id) })
  } catch (err) { next(err) }
}

// POST /api/learning/videos/:videoId/watch
export async function markVideoWatched(req, res, next) {
  try {
    await query(`
      INSERT INTO video_watched (user_id, video_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [req.user.id, req.params.videoId])
    res.json({ watched: true, videoId: req.params.videoId })
  } catch (err) { next(err) }
}

// POST /api/learning/modules — Tạo module mới (Admin)
export async function createModule(req, res, next) {
  try {
    const {
      title, level = 'Cơ bản', department = ['all'],
      lessons = 0, videos = 0, estimated_hours = 0,
      icon = 'BookOpen', locked = false, order_index
    } = req.body

    if (!title?.trim())
      return res.status(400).json({ error: 'Tên module là bắt buộc' })

    const validLevels = ['Cơ bản', 'Trung cấp', 'Nâng cao', 'Chuyên gia']
    if (!validLevels.includes(level))
      return res.status(400).json({ error: 'Cấp độ không hợp lệ' })

    const deptArr = Array.isArray(department) ? department : JSON.parse(department)

    let orderIdx = order_index
    if (orderIdx === undefined) {
      const { rows } = await query(
        'SELECT COALESCE(MAX(order_index), 0) + 1 as next FROM modules'
      )
      orderIdx = rows[0].next
    }

    const { rows } = await query(`
      INSERT INTO modules
        (title, level, department, lessons, videos,
         estimated_hours, icon, locked, order_index)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [title.trim(), level, deptArr, lessons, videos,
        estimated_hours, icon, locked, orderIdx])

    await query(
      'INSERT INTO activity_logs (action,entity_type,entity_name,user_id) VALUES ($1,$2,$3,$4)',
      ['Tạo module', 'module', title, req.user.id]
    )

    res.status(201).json({ module: rows[0] })
  } catch (err) { next(err) }
}

// PUT /api/learning/modules/:id — Sửa module (Admin)
export async function updateModule(req, res, next) {
  try {
    const {
      title, level, department, lessons,
      videos, estimated_hours, icon, locked, order_index
    } = req.body

    const updates = []
    const params = []

    if (title) { params.push(title.trim()); updates.push(`title=$${params.length}`) }
    if (level) { params.push(level); updates.push(`level=$${params.length}`) }
    if (department) {
      const arr = Array.isArray(department) ? department : JSON.parse(department)
      params.push(arr); updates.push(`department=$${params.length}`)
    }
    if (lessons !== undefined) { params.push(lessons); updates.push(`lessons=$${params.length}`) }
    if (videos !== undefined) { params.push(videos); updates.push(`videos=$${params.length}`) }
    if (estimated_hours !== undefined) { params.push(estimated_hours); updates.push(`estimated_hours=$${params.length}`) }
    if (icon) { params.push(icon); updates.push(`icon=$${params.length}`) }
    if (locked !== undefined) { params.push(locked); updates.push(`locked=$${params.length}`) }
    if (order_index !== undefined) { params.push(order_index); updates.push(`order_index=$${params.length}`) }

    if (updates.length === 0)
      return res.status(400).json({ error: 'Không có gì để cập nhật' })

    updates.push('updated_at=NOW()')
    params.push(req.params.id)

    const { rows } = await query(
      `UPDATE modules SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Module không tồn tại' })

    res.json({ module: rows[0] })
  } catch (err) { next(err) }
}

// DELETE /api/learning/modules/:id — Xoá module (Admin)
export async function deleteModule(req, res, next) {
  try {
    await query('DELETE FROM quiz_questions WHERE module_id=$1', [req.params.id])
    await query('DELETE FROM learning_progress WHERE module_id=$1', [req.params.id])
    await query('DELETE FROM certificates WHERE module_id=$1', [req.params.id])
    const { rows } = await query(
      'DELETE FROM modules WHERE id=$1 RETURNING title',
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Module không tồn tại' })

    res.json({ message: 'Đã xoá module: ' + rows[0].title })
  } catch (err) { next(err) }
}
