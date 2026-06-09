import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { query } from '../config/db.js'

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Chưa đăng nhập' })

    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, config.JWT_SECRET)

    // Lấy user từ DB để đảm bảo vẫn active
    const { rows } = await query(
      'SELECT id, email, name, department, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    )
    if (!rows[0] || !rows[0].is_active)
      return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc bị khoá' })

    req.user = rows[0]
    next()
  } catch (err) {
    next(err)
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện' })
  next()
}
