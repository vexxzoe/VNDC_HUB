import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getModules, getModuleById, updateProgress,
  getQuiz, submitQuiz, getCertificate,
  getUserProgress, getVideoStatus, markVideoWatched
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

// User progress
router.get('/progress',                   getUserProgress)

// Videos
router.get('/videos/status',              getVideoStatus)
router.post('/videos/:videoId/watch',     markVideoWatched)

export default router
