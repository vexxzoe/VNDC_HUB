import pg from 'pg'
import { config } from './env.js'

const { Pool } = pg

export const pool = new Pool({
  host:     config.DB_HOST,
  port:     config.DB_PORT,
  database: config.DB_NAME,
  user:     config.DB_USER,
  password: config.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message)
})

export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  if (config.NODE_ENV === 'development') {
    console.log(`🔍 SQL [${Date.now() - start}ms]:`, text.substring(0, 60))
  }
  return res
}

export async function testConnection() {
  try {
    const res = await query('SELECT NOW() as time, current_database() as db')
    console.log('✅ PostgreSQL connected:', res.rows[0])
    return true
  } catch (err) {
    console.error('❌ PostgreSQL failed:', err.message)
    return false
  }
}
