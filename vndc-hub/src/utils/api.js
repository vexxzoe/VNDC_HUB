const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem('vndc_user') || '{}')
    return user?.token || null
  } catch {
    return null
  }
}

async function request(method, path, body = null, isFormData = false) {
  const token = getToken()
  const headers = {}

  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const options = { method, headers }
  if (body) options.body = isFormData ? body : JSON.stringify(body)

  const res = await fetch(`${BASE_URL}/api${path}`, options)

  // Token hết hạn → logout
  if (res.status === 401) {
    localStorage.removeItem('vndc_user')
    window.location.href = '/login'
    throw new Error('UNAUTHORIZED')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'API Error')
  return data
}

export const api = {
  // Auth
  login:          (email, password) =>
    request('POST', '/auth/login', { email, password }),
  logout:         (refreshToken) =>
    request('POST', '/auth/logout', { refreshToken }),
  getMe:          () => request('GET', '/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('PUT', '/auth/change-password', { currentPassword, newPassword }),
  updateProfile:  (data) => request('PUT', '/auth/profile', data),

  // Documents
  getDocuments:   (params = {}) =>
    request('GET', '/documents?' + new URLSearchParams(params)),
  getDocument:    (id) => request('GET', `/documents/${id}`),
  createDocument: (formData) =>
    request('POST', '/documents', formData, true),
  updateDocument: (id, formData) =>
    request('PUT', `/documents/${id}`, formData, true),
  deleteDocument: (id) => request('DELETE', `/documents/${id}`),
  toggleBookmark: (id) => request('POST', `/documents/${id}/bookmark`),
  getDocStats:    () => request('GET', '/documents/stats'),

  // Learning
  getModules:      () => request('GET', '/learning/modules'),
  getModule:       (id) => request('GET', `/learning/modules/${id}`),
  updateProgress:  (id, progress) =>
    request('PUT', `/learning/modules/${id}/progress`, { progress }),
  getQuiz:         (id) => request('GET', `/learning/modules/${id}/quiz`),
  submitQuiz:      (id, answers) =>
    request('POST', `/learning/modules/${id}/quiz/submit`, { answers }),
  getCertificate:  (id) => request('GET', `/learning/modules/${id}/certificate`),
  getUserProgress: () => request('GET', '/learning/progress'),
  
  // Quiz Manager
  getQuestionsAdmin: (moduleId) => request('GET', `/quiz/modules/${moduleId}/questions`),
  createQuestion: (moduleId, data) => request('POST', `/quiz/modules/${moduleId}/questions`, data),
  updateQuestion: (id, data) => request('PUT', `/quiz/questions/${id}`, data),
  deleteQuestion: (id) => request('DELETE', `/quiz/questions/${id}`),
  getVideoStatus:  () => request('GET', '/learning/videos/status'),
  markVideoWatched:(videoId) =>
    request('POST', `/learning/videos/${videoId}/watch`),

  // Module Manager (Admin)
  createModule: (data) => request('POST', '/learning/modules', data),
  updateModule: (id, data) => request('PUT', `/learning/modules/${id}`, data),
  deleteModule: (id) => request('DELETE', `/learning/modules/${id}`),

  // Users
  getUsers:       (params = {}) =>
    request('GET', '/users?' + new URLSearchParams(params)),
  createUser:     (data) => request('POST', '/users', data),
  updateUser:     (id, data) => request('PUT', `/users/${id}`, data),
  deleteUser:     (id) => request('DELETE', `/users/${id}`),
  getDeptPerms:   () => request('GET', '/users/departments/permissions'),
  updateDeptPerm: (dept, permission, value) =>
    request('PUT', `/users/departments/${dept}/permissions`, { permission, value }),

  // Updates
  getTasks:       (params = {}) =>
    request('GET', '/updates?' + new URLSearchParams(params)),
  createTask:     (data) => request('POST', '/updates', data),
  approveTask:    (id) => request('PUT', `/updates/${id}/approve`),
  trainAI:        (id) => request('PUT', `/updates/${id}/train-ai`),
  notifyUsers:    (id) => request('PUT', `/updates/${id}/notify`),
  deleteTask:     (id) => request('DELETE', `/updates/${id}`),

  // Analytics
  getAnalyticsOverview: () => request('GET', '/analytics/overview'),
  getTopDocs:     () => request('GET', '/analytics/top-docs'),
  getDeptProgress:() => request('GET', '/analytics/department-progress'),
  getActivityLog: () => request('GET', '/analytics/activity-log'),

  // Notifications
  getNotifications: () => request('GET', '/notifications'),
  markRead:       (id) => request('PUT', `/notifications/${id}/read`),
  markAllRead:    () => request('PUT', '/notifications/read-all'),

  // AI
  chat: (message, history) =>
    request('POST', '/ai/chat', { message, history }),
}
