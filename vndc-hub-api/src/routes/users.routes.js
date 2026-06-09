import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireRole, requireAdminOrSelf } from '../middleware/rbac.js'
import {
  getUsers, getUserById, createUser,
  updateUser, deleteUser,
  getDeptPermissions, updateDeptPermission
} from '../controllers/users.controller.js'

const router = Router()

// Tất cả routes cần auth
router.use(authenticate)

// Department permissions
router.get('/departments/permissions',          requireRole('admin'), getDeptPermissions)
router.put('/departments/:dept/permissions',    requireRole('admin'), updateDeptPermission)

// User CRUD
router.get('/',         requireRole('admin'), getUsers)
router.post('/',        requireRole('admin'), createUser)
router.get('/:id',      requireAdminOrSelf,   getUserById)
router.put('/:id',      requireAdminOrSelf,   updateUser)
router.delete('/:id',   requireRole('admin'), deleteUser)

export default router
