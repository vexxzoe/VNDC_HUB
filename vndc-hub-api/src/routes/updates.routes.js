import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { uploadSingle } from '../middleware/upload.js'
import {
  getTasks, createTask, approveTask,
  trainAI, notifyUsers, deleteTask
} from '../controllers/updates.controller.js'

const router = Router()
router.use(authenticate)

router.get('/',              getTasks)
router.post('/',             uploadSingle, createTask)
router.put('/:id/approve',   requireRole('admin'), approveTask)
router.put('/:id/train-ai',  requireRole('admin'), trainAI)
router.put('/:id/notify',    requireRole('admin'), notifyUsers)
router.delete('/:id',        requireRole('admin'), deleteTask)

export default router
