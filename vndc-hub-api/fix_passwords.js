import bcrypt from 'bcryptjs'
import { pool } from './src/config/db.js'

const hash = await bcrypt.hash('123456', 10)
const emails = ['admin@vndc.vn','sales@vndc.vn','cskh@vndc.vn','tech@vndc.vn']
for (const email of emails) {
  await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, email])
  console.log('Updated:', email)
}
await pool.end()
console.log('Done! Hash:', hash)
