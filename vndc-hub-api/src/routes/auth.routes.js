import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  login, register, refreshToken, logout,
  getMe, changePassword, updateProfile
} from '../controllers/auth.controller.js'

const router = Router()

// Public routes
router.post('/login',    login)
router.post('/register', register)
router.post('/refresh',  refreshToken)
router.post('/logout',   logout)

// Protected routes
router.get('/me',                authenticate, getMe)
router.put('/change-password',   authenticate, changePassword)
router.put('/profile',           authenticate, updateProfile)

export default router
