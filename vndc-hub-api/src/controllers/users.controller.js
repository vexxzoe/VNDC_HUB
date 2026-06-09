import bcrypt from 'bcryptjs'
import { query } from '../config/db.js'

// Format user (bỏ password)
function fmt(u) {
  const { password, ...rest } = u
  return rest
}

// GET /api/users — Admin only
export async function getUsers(req, res, next) {
  try {
    const { department, role, search } = req.query
    let sql = `SELECT id,email,name,department,role,phone,
                      avatar_url,is_active,created_at
               FROM users WHERE is_active = true`
    const params = []

    if (department) {
      params.push(department)
      sql += ` AND department = $${params.length}`
    }
    if (role) {
      params.push(role)
      sql += ` AND role = $${params.length}`
    }
    if (search) {
      params.push(`%${search}%`)
      sql += ` AND (name ILIKE $${params.length}
               OR email ILIKE $${params.length})`
    }
    sql += ' ORDER BY created_at ASC'

    const { rows } = await query(sql, params)
    res.json({ users: rows, total: rows.length })
  } catch (err) { next(err) }
}

// GET /api/users/:id
export async function getUserById(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id,email,name,department,role,phone,bio,
              avatar_url,is_active,created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    )
    if (!rows[0])
      return res.status(404).json({ error: 'Không tìm thấy user' })
    res.json({ user: rows[0] })
  } catch (err) { next(err) }
}

// POST /api/users — Admin only
export async function createUser(req, res, next) {
  try {
    const { email, password='123456', name, department='Chung', role='member' } = req.body

    if (!email || !name)
      return res.status(400).json({ error: 'Email và họ tên là bắt buộc' })

    const hashed = await bcrypt.hash(password, 10)
    const { rows } = await query(
      `INSERT INTO users (email,password,name,department,role)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [email.toLowerCase().trim(), hashed, name.trim(), department, role]
    )

    await query(
      'INSERT INTO activity_logs (action,entity_type,entity_name,user_id) VALUES ($1,$2,$3,$4)',
      ['Tạo tài khoản', 'user', email, req.user.id]
    )

    res.status(201).json({ user: fmt(rows[0]) })
  } catch (err) { next(err) }
}

// PUT /api/users/:id — Admin hoặc chính user đó
export async function updateUser(req, res, next) {
  try {
    const { name, phone, bio, department, role, is_active } = req.body
    const isAdmin = req.user.role === 'admin'

    // Member chỉ được sửa name/phone/bio, không được sửa role/dept
    const updates = []
    const params = []

    if (name) { params.push(name.trim()); updates.push(`name=$${params.length}`) }
    if (phone !== undefined) { params.push(phone); updates.push(`phone=$${params.length}`) }
    if (bio !== undefined) { params.push(bio); updates.push(`bio=$${params.length}`) }

    // Chỉ admin mới được đổi các field này
    if (isAdmin) {
      if (department) { params.push(department); updates.push(`department=$${params.length}`) }
      if (role) { params.push(role); updates.push(`role=$${params.length}`) }
      if (is_active !== undefined) { params.push(is_active); updates.push(`is_active=$${params.length}`) }
    }

    if (updates.length === 0)
      return res.status(400).json({ error: 'Không có gì để cập nhật' })

    updates.push(`updated_at=NOW()`)
    params.push(req.params.id)

    const { rows } = await query(
      `UPDATE users SET ${updates.join(',')}
       WHERE id=$${params.length} RETURNING *`,
      params
    )
    if (!rows[0])
      return res.status(404).json({ error: 'Không tìm thấy user' })

    res.json({ user: fmt(rows[0]) })
  } catch (err) { next(err) }
}

// DELETE /api/users/:id — Admin only
// Soft delete (is_active = false)
export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'Không thể xoá tài khoản của chính mình' })

    const { rows } = await query(
      `UPDATE users SET is_active=false, updated_at=NOW()
       WHERE id=$1 RETURNING email,name`,
      [req.params.id]
    )
    if (!rows[0])
      return res.status(404).json({ error: 'Không tìm thấy user' })

    await query(
      'INSERT INTO activity_logs (action,entity_type,entity_name,user_id) VALUES ($1,$2,$3,$4)',
      ['Vô hiệu hoá tài khoản', 'user', rows[0].email, req.user.id]
    )

    res.json({ message: `Đã vô hiệu hoá: ${rows[0].name}` })
  } catch (err) { next(err) }
}

// GET /api/users/departments/permissions — Lấy permission matrix
export async function getDeptPermissions(req, res, next) {
  try {
    const { rows } = await query(
      'SELECT * FROM department_permissions ORDER BY department'
    )
    res.json({ permissions: rows })
  } catch (err) { next(err) }
}

// PUT /api/users/departments/:dept/permissions — Admin only
export async function updateDeptPermission(req, res, next) {
  try {
    const department = decodeURIComponent(req.params.dept)
    const { permission, value } = req.body

    console.log('updateDeptPerm:', { department, permission, value })

    const validPerms = ['library','videos','forms','updates','analytics','people']
    if (!validPerms.includes(permission))
      return res.status(400).json({ error: 'Permission không hợp lệ' })

    const { rows } = await query(
      `UPDATE department_permissions
       SET ${permission}=$1, updated_at=NOW(), updated_by=$2
       WHERE department=$3
       RETURNING *`,
      [value, req.user.id, department]
    )
    if (!rows[0])
      return res.status(404).json({ error: 'Phòng ban không tồn tại' })

    // Log change
    await query(
      `INSERT INTO permission_logs
       (department,permission,new_value,changed_by)
       VALUES ($1,$2,$3,$4)`,
      [department, permission, value, req.user.id]
    )

    res.json({
      message: `Đã ${value?'bật':'tắt'} quyền ${permission} cho ${department}`,
      permissions: rows[0]
    })
  } catch (err) { next(err) }
}
