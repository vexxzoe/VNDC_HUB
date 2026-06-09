import { query } from '../config/db.js'

// GET /api/notifications
export async function getNotifications(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT * FROM notifications
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id])

    const unread = rows.filter(n => !n.is_read).length
    res.json({ notifications: rows, unread })
  } catch (err) { next(err) }
}

// PUT /api/notifications/:id/read
export async function markRead(req, res, next) {
  try {
    await query(
      `UPDATE notifications SET is_read=true
       WHERE id=$1 AND (user_id=$2 OR user_id IS NULL)`,
      [req.params.id, req.user.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// PUT /api/notifications/read-all
export async function markAllRead(req, res, next) {
  try {
    await query(
      `UPDATE notifications SET is_read=true
       WHERE (user_id=$1 OR user_id IS NULL) AND is_read=false`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// POST /api/notifications — Admin broadcast
export async function createNotification(req, res, next) {
  try {
    const { text, icon='Bell', link, targetUserId } = req.body
    if (!text)
      return res.status(400).json({ error: 'Nội dung thông báo là bắt buộc' })

    // targetUserId = null → broadcast cho tất cả
    const { rows } = await query(`
      INSERT INTO notifications (user_id, text, icon, link)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [targetUserId || null, text, icon, link || null])

    res.status(201).json({ notification: rows[0] })
  } catch (err) { next(err) }
}
