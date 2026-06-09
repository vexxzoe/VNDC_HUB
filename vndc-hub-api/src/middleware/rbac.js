import { query } from '../config/db.js'

// Kiểm tra role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: 'Chưa đăng nhập' })
    if (!roles.includes(req.user.role))
      return res.status(403).json({
        error: `Yêu cầu quyền: ${roles.join(' hoặc ')}`
      })
    next()
  }
}

// Kiểm tra permission theo department
export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') return next()

      const { rows } = await query(
        'SELECT * FROM department_permissions WHERE department = $1',
        [req.user.department]
      )
      const perms = rows[0]
      if (!perms || !perms[permission])
        return res.status(403).json({
          error: `Phòng ban ${req.user.department} không có quyền truy cập`
        })
      next()
    } catch (err) { next(err) }
  }
}

// Kiểm tra admin hoặc chính user đó
export function requireAdminOrSelf(req, res, next) {
  const targetId = req.params.id
  if (req.user.role === 'admin' || req.user.id === targetId)
    return next()
  res.status(403).json({ error: 'Không có quyền thực hiện' })
}
