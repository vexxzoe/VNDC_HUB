import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import {
  getModules, getModuleById, updateProgress,
  getQuiz, submitQuiz, getCertificate,
  getUserProgress, getVideoStatus, markVideoWatched,
  createModule, updateModule, deleteModule
} from '../controllers/learning.controller.js'

const router = Router()
router.use(authenticate)

// Modules
router.get('/modules',                    getModules)
router.get('/modules/:id',                getModuleById)
router.put('/modules/:id/progress',       updateProgress)
router.get('/modules/:id/quiz',           getQuiz)
router.post('/modules/:id/quiz/submit',   submitQuiz)
router.get('/modules/:id/certificate',    getCertificate)

// Module CRUD (Admin only)
router.post('/modules',                   requireRole('admin'), createModule)
router.put('/modules/:id',                requireRole('admin'), updateModule)
router.delete('/modules/:id',             requireRole('admin'), deleteModule)

// User progress
router.get('/progress',                   getUserProgress)

// Videos
router.get('/videos/status',              getVideoStatus)
router.post('/videos/:videoId/watch',     markVideoWatched)

export default router
