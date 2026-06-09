import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import {
  getOverview, getTopDocs,
  getDeptProgress, getActivityLog
} from '../controllers/analytics.controller.js'

const router = Router()
router.use(authenticate)
router.use(requireRole('admin'))

router.get('/overview',             getOverview)
router.get('/top-docs',             getTopDocs)
router.get('/department-progress',  getDeptProgress)
router.get('/activity-log',         getActivityLog)

export default router
