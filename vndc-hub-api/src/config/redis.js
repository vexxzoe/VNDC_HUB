import { createClient } from 'redis'
import { config } from './env.js'

export const redis = createClient({
  socket: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  }
})

redis.on('error', err => console.error('❌ Redis error:', err.message))
redis.on('connect', () => console.log('✅ Redis connected'))

export async function connectRedis() {
  try {
    await redis.connect()
    return true
  } catch (err) {
    console.error('❌ Redis failed:', err.message)
    return false
  }
}
