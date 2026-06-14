import { query } from '../config/db.js'

// GET /api/quiz/modules/:moduleId/questions — Admin lấy tất cả câu hỏi kèm answer
export async function getQuestionsAdmin(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT * FROM quiz_questions
      WHERE module_id = $1
      ORDER BY order_index ASC
    `, [req.params.moduleId])
    res.json({ questions: rows })
  } catch (err) { next(err) }
}

// POST /api/quiz/modules/:moduleId/questions — Tạo câu hỏi mới
export async function createQuestion(req, res, next) {
  try {
    const { question, options, answer, order_index } = req.body

    if (!question?.trim())
      return res.status(400).json({ error: 'Câu hỏi là bắt buộc' })
    if (!Array.isArray(options) || options.length < 2)
      return res.status(400).json({ error: 'Cần ít nhất 2 đáp án' })
    if (answer === undefined || answer < 0 || answer >= options.length)
      return res.status(400).json({ error: 'Đáp án không hợp lệ' })

    // Lấy order_index tiếp theo nếu không truyền
    let orderIdx = order_index
    if (orderIdx === undefined) {
      const { rows } = await query(
        'SELECT COALESCE(MAX(order_index), 0) + 1 as next FROM quiz_questions WHERE module_id = $1',
        [req.params.moduleId]
      )
      orderIdx = rows[0].next
    }

    const { rows } = await query(`
      INSERT INTO quiz_questions
        (module_id, question, options, answer, order_index)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [req.params.moduleId, question.trim(), JSON.stringify(options), answer, orderIdx])

    res.status(201).json({ question: rows[0] })
  } catch (err) { next(err) }
}

// PUT /api/quiz/questions/:id — Sửa câu hỏi
export async function updateQuestion(req, res, next) {
  try {
    const { question, options, answer, order_index } = req.body
    const updates = []
    const params = []

    if (question) { params.push(question.trim()); updates.push(`question=$${params.length}`) }
    if (options)  { params.push(JSON.stringify(options)); updates.push(`options=$${params.length}`) }
    if (answer !== undefined) { params.push(answer); updates.push(`answer=$${params.length}`) }
    if (order_index !== undefined) { params.push(order_index); updates.push(`order_index=$${params.length}`) }

    if (updates.length === 0)
      return res.status(400).json({ error: 'Không có gì để cập nhật' })

    params.push(req.params.id)
    const { rows } = await query(
      `UPDATE quiz_questions SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Câu hỏi không tồn tại' })
    res.json({ question: rows[0] })
  } catch (err) { next(err) }
}

// DELETE /api/quiz/questions/:id — Xoá câu hỏi
export async function deleteQuestion(req, res, next) {
  try {
    const { rows } = await query(
      'DELETE FROM quiz_questions WHERE id=$1 RETURNING id',
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Câu hỏi không tồn tại' })
    res.json({ message: 'Đã xoá câu hỏi' })
  } catch (err) { next(err) }
}
