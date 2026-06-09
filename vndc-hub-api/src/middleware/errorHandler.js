import { config } from '../config/env.js'

export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message)

  // PostgreSQL unique violation
  if (err.code === '23505')
    return res.status(409).json({
      error: 'Dữ liệu đã tồn tại', detail: err.detail
    })

  // PostgreSQL foreign key violation
  if (err.code === '23503')
    return res.status(400).json({
      error: 'Dữ liệu tham chiếu không hợp lệ'
    })

  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ error: 'Token không hợp lệ' })

  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ error: 'Token đã hết hạn' })

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ error: 'File quá lớn (tối đa 100MB)' })
    return res.status(400).json({ error: 'Lỗi upload: ' + err.message })
  }

  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  })
}
