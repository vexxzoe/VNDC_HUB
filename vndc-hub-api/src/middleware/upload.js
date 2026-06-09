import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { config } from '../config/env.js'

// Đảm bảo thư mục tồn tại
const uploadDir = path.join(process.cwd(), config.UPLOAD_DIR, 'documents')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50)
    const unique = Date.now() + '_' + Math.round(Math.random()*1e6)
    cb(null, `${base}_${unique}${ext}`)
  }
})

function fileFilter(req, file, cb) {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'image/jpeg', 'image/png', 'image/webp',
  ]
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Định dạng file không được hỗ trợ'), false)
  }
}

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.MAX_FILE_SIZE }
}).single('file')

// Detect type từ mimetype
export function detectFileType(mimetype) {
  if (mimetype === 'application/pdf' ||
      mimetype?.includes('word')) return 'PDF'
  if (mimetype?.includes('excel') ||
      mimetype?.includes('spreadsheet')) return 'Excel'
  if (mimetype?.startsWith('video/')) return 'Video'
  return 'Module'
}

// Format file size
export function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/(1024*1024)).toFixed(1) + ' MB'
}
