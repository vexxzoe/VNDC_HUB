import { query } from '../config/db.js'

// GET /api/analytics/overview
export async function getOverview(req, res, next) {
  try {
    const [docs, users, modules, views, activities] = await Promise.all([
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type='PDF') as pdf,
        COUNT(*) FILTER (WHERE type='Excel') as excel,
        COUNT(*) FILTER (WHERE type='Video') as video,
        COUNT(*) FILTER (WHERE type='Module') as module,
        COALESCE(SUM(views),0) as total_views
        FROM documents WHERE is_active=true`),

      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE role='admin') as admins,
        COUNT(*) FILTER (WHERE is_active=true) as active
        FROM users`),

      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE locked=false) as unlocked
        FROM modules`),

      query(`SELECT COUNT(*) as total FROM document_views
             WHERE viewed_at > NOW() - INTERVAL '30 days'`),

      query(`SELECT al.action, al.entity_name,
                    al.created_at as log_time,
                    u.name as user_name, u.department
             FROM activity_logs al
             LEFT JOIN users u ON u.id = al.user_id
             ORDER BY al.created_at DESC LIMIT 10`),
    ])

    res.json({
      documents: docs.rows[0],
      users:     users.rows[0],
      modules:   modules.rows[0],
      views:     views.rows[0],
      recentActivities: activities.rows,
    })
  } catch (err) { next(err) }
}

// GET /api/analytics/top-docs
export async function getTopDocs(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT id, name, type, department, views
      FROM documents
      WHERE is_active=true
      ORDER BY views DESC
      LIMIT 5
    `)
    res.json({ docs: rows })
  } catch (err) { next(err) }
}

// GET /api/analytics/department-progress
export async function getDeptProgress(req, res, next) {
  try {
    const { rows } = await query(`
      SELECT
        u.department,
        COUNT(DISTINCT u.id) as employee_count,
        COUNT(DISTINCT m.id) as assigned_modules,
        ROUND(AVG(COALESCE(lp.progress,0))) as avg_progress,
        COUNT(DISTINCT lp.user_id)
          FILTER (WHERE lp.progress = 100) as completed_users
      FROM users u
      CROSS JOIN modules m
      LEFT JOIN learning_progress lp
        ON lp.user_id = u.id AND lp.module_id = m.id
      WHERE u.is_active = true
        AND u.role = 'member'
        AND ('all' = ANY(m.department) OR u.department = ANY(m.department))
      GROUP BY u.department
      ORDER BY avg_progress DESC
    `)
    res.json({ departments: rows })
  } catch (err) { next(err) }
}

// GET /api/analytics/activity-log
export async function getActivityLog(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20
    const { rows } = await query(`
      SELECT al.*, u.name as user_name, u.department
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT $1
    `, [limit])
    res.json({ activities: rows })
  } catch (err) { next(err) }
}
