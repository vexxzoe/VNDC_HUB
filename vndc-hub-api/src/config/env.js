import 'dotenv/config'

const required = [
  'DB_HOST', 'DB_PORT', 'DB_NAME',
  'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'
]

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env: ${key}`)
    process.exit(1)
  }
}

export const config = {
  PORT:             parseInt(process.env.PORT) || 3001,
  NODE_ENV:         process.env.NODE_ENV || 'development',
  DB_HOST:          process.env.DB_HOST,
  DB_PORT:          parseInt(process.env.DB_PORT) || 5433,
  DB_NAME:          process.env.DB_NAME,
  DB_USER:          process.env.DB_USER,
  DB_PASSWORD:      process.env.DB_PASSWORD,
  REDIS_HOST:       process.env.REDIS_HOST || 'localhost',
  REDIS_PORT:       parseInt(process.env.REDIS_PORT) || 6380,
  JWT_SECRET:       process.env.JWT_SECRET,
  JWT_EXPIRES_IN:   process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  UPLOAD_DIR:       process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE:    parseInt(process.env.MAX_FILE_SIZE) || 104857600,
  FRONTEND_URL:     process.env.FRONTEND_URL || 'http://localhost:5173',
  GEMINI_API_KEY:   process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY:     process.env.GROQ_API_KEY || '',
}
