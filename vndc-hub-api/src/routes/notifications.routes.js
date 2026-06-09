import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import {
  getNotifications, markRead,
  markAllRead, createNotification
} from '../controllers/notifications.controller.js'

const router = Router()
router.use(authenticate)
router.get('/',           getNotifications)
router.put('/read-all',   markAllRead)
router.put('/:id/read',   markRead)
router.post('/',          requireRole('admin'), createNotification)
export default router
