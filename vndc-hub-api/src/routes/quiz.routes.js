import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { getQuestionsAdmin, createQuestion, updateQuestion, deleteQuestion } from '../controllers/quiz.controller.js'

const router = Router()
router.use(authenticate)

// Admin only — quản lý câu hỏi
router.get('/modules/:moduleId/questions', requireRole('admin'), getQuestionsAdmin)
router.post('/modules/:moduleId/questions', requireRole('admin'), createQuestion)
router.put('/questions/:id', requireRole('admin'), updateQuestion)
router.delete('/questions/:id', requireRole('admin'), deleteQuestion)

export default router
