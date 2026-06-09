import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/db.js'
import { config } from '../config/env.js'

// Helper tạo tokens
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  )
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.JWT_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN }
  )
  return { accessToken, refreshToken }
}

// Helper format user response (không trả password)
function formatUser(user) {
  const { password, ...rest } = user
  return rest
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' })

    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    )
    const user = rows[0]
    if (!user)
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })

    const { accessToken, refreshToken } = generateTokens(user.id)

    // Lưu refresh token vào DB
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    )

    // Log activity
    await query(
      'INSERT INTO activity_logs (action, entity_type, entity_name, user_id) VALUES ($1,$2,$3,$4)',
      ['Đăng nhập', 'auth', user.email, user.id]
    )

    res.json({
      accessToken,
      refreshToken,
      user: formatUser(user),
    })
  } catch (err) { next(err) }
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { email, password, name, department = 'Chung' } = req.body

    if (!email || !password || !name)
      return res.status(400).json({ error: 'Email, mật khẩu và họ tên là bắt buộc' })

    if (password.length < 6)
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' })

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Email không hợp lệ' })

    const hashed = await bcrypt.hash(password, 10)

    const { rows } = await query(
      `INSERT INTO users (email, password, name, department, role)
       VALUES ($1, $2, $3, $4, 'member')
       RETURNING *`,
      [email.toLowerCase().trim(), hashed, name.trim(), department]
    )
    const user = rows[0]
    const { accessToken, refreshToken } = generateTokens(user.id)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, refreshToken, expiresAt]
    )

    res.status(201).json({
      accessToken,
      refreshToken,
      user: formatUser(user),
    })
  } catch (err) { next(err) }
}

// POST /api/auth/refresh
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken)
      return res.status(400).json({ error: 'Refresh token là bắt buộc' })

    // Kiểm tra token trong DB
    const { rows } = await query(
      `SELECT rt.*, u.id as uid, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken]
    )
    const record = rows[0]
    if (!record || !record.is_active)
      return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn' })

    // Verify JWT
    jwt.verify(refreshToken, config.JWT_SECRET)

    // Xoá token cũ, tạo token mới (rotation)
    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken])

    const tokens = generateTokens(record.user_id)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [record.user_id, tokens.refreshToken, expiresAt]
    )

    res.json(tokens)
  } catch (err) { next(err) }
}

// POST /api/auth/logout
export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken])
    }
    res.json({ message: 'Đăng xuất thành công' })
  } catch (err) { next(err) }
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ user: req.user })
}

// PUT /api/auth/change-password
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' })

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự' })

    const { rows } = await query(
      'SELECT password FROM users WHERE id = $1', [req.user.id]
    )
    const valid = await bcrypt.compare(currentPassword, rows[0].password)
    if (!valid)
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashed, req.user.id]
    )

    // Xoá tất cả refresh tokens (bắt đăng nhập lại)
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id])

    res.json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' })
  } catch (err) { next(err) }
}

// PUT /api/auth/profile
export async function updateProfile(req, res, next) {
  try {
    const { name, phone, bio } = req.body
    if (!name?.trim())
      return res.status(400).json({ error: 'Họ tên không được để trống' })

    const { rows } = await query(
      `UPDATE users SET name=$1, phone=$2, bio=$3, updated_at=NOW()
       WHERE id=$4 RETURNING id,email,name,department,role,phone,bio,avatar_url`,
      [name.trim(), phone || null, bio || null, req.user.id]
    )
    res.json({ user: rows[0] })
  } catch (err) { next(err) }
}
