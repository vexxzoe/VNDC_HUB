import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { config } from './config/env.js'
import { testConnection } from './config/db.js'
import { connectRedis } from './config/redis.js'
import { errorHandler } from './middleware/errorHandler.js'
import router from './routes/index.js'

const app = express()

app.use(helmet())
app.use(cors({
  origin: function(origin, callback) {
    // Cho phép các localhost port khác nhau khi dev
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean)

    // Cho phép requests không có origin (Postman, curl)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS: origin không được phép: ' + origin))
    }
  },
  credentials: true,
}))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Quá nhiều yêu cầu, thử lại sau' }
}))
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', (req, res, next) => {
  // Mẹo bypass IDM: Nếu URL có đuôi .stream thì đổi lại thành .mp4 để express.static đọc đúng file vật lý
  if (req.url.endsWith('.stream')) {
    req.url = req.url.replace('.stream', '.mp4');
  }
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Timing-Allow-Origin', '*')
  next()
}, express.static(config.UPLOAD_DIR, {
  setHeaders: (res, path) => {
    // Cho phép video streaming với range requests
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Timing-Allow-Origin', '*')
  }
}))
app.use('/api', router)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `${req.method} ${req.path} không tồn tại`
  })
})

// Global error handler
app.use(errorHandler)

async function start() {
  console.log('🚀 Starting VNDC HUB API...')
  console.log(`📦 DB: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`)
  console.log(`📦 Redis: ${config.REDIS_HOST}:${config.REDIS_PORT}`)

  const [dbOk, redisOk] = await Promise.all([
    testConnection(),
    connectRedis(),
  ])

  if (!dbOk) {
    console.error('❌ PostgreSQL không kết nối được. Kiểm tra Docker container.')
    process.exit(1)
  }

  if (!redisOk) {
    console.warn('⚠️  Redis không kết nối được — tiếp tục không có cache')
  }

  app.listen(config.PORT, () => {
    console.log(`\n✅ VNDC HUB API ready!`)
    console.log(`🌐 http://localhost:${config.PORT}/api/health`)
    console.log(`📁 Uploads: ${config.UPLOAD_DIR}`)
    console.log(`🌍 Env: ${config.NODE_ENV}\n`)
  })
}

start()
