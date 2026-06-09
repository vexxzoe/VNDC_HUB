import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { uploadSingle } from '../middleware/upload.js'
import {
  getDocuments, getDocumentById, createDocument,
  updateDocument, deleteDocument,
  toggleBookmark, getDocumentStats
} from '../controllers/documents.controller.js'

const router = Router()
router.use(authenticate)

router.get('/stats',        requireRole('admin'), getDocumentStats)
router.get('/',             getDocuments)
router.get('/:id',          getDocumentById)
router.post('/',            uploadSingle, createDocument)
router.put('/:id',          uploadSingle, updateDocument)
router.delete('/:id',       requireRole('admin'), deleteDocument)
router.post('/:id/bookmark',toggleBookmark)

export default router
