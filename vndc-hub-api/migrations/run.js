import { pool } from '../src/config/db.js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function runMigrations() {
  console.log('🔄 Running migrations...')

  // Ensure migrations tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Find all .sql files sorted alphabetically
  const files = readdirSync(__dirname)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT id FROM _migrations WHERE filename = $1', [file]
    )

    if (rows.length > 0) {
      console.log(`⏭️  Skip: ${file}`)
      continue
    }

    console.log(`⚙️  Running: ${file}`)
    const sql = readFileSync(join(__dirname, file), 'utf8')
    await pool.query(sql)
    await pool.query(
      'INSERT INTO _migrations (filename) VALUES ($1)', [file]
    )
    console.log(`✅ Done: ${file}`)
  }

  console.log('✅ All migrations complete')
  await pool.end()
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
})
