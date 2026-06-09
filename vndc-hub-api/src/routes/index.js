import { Router } from 'express'
import authRoutes from './auth.routes.js'
import usersRoutes from './users.routes.js'
import documentsRoutes from './documents.routes.js'
import learningRoutes from './learning.routes.js'
import aiRoutes from './ai.routes.js'
import notificationsRoutes from './notifications.routes.js'
import updatesRoutes from './updates.routes.js'
import analyticsRoutes from './analytics.routes.js'

const router = Router()

router.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'VNDC HUB API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/documents', documentsRoutes)
router.use('/learning', learningRoutes)
router.use('/ai', aiRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/updates', updatesRoutes)
router.use('/analytics', analyticsRoutes)

export default router
