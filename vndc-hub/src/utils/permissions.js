// Helper: normalize department field về array
export function normalizeDept(dept) {
  if (!dept) return ['all']
  if (Array.isArray(dept)) return dept
  // PostgreSQL array string: "{all}" hoặc "{Kinh doanh,CSKH}"
  if (typeof dept === 'string') {
    return dept.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean)
  }
  return ['all']
}

// Helper: normalize audience field về array  
export function normalizeAudience(audience) {
  if (!audience) return ['all']
  if (Array.isArray(audience)) return audience
  if (typeof audience === 'string') {
    return audience.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean)
  }
  return ['all']
}

export function canAccessDoc(doc, user) {
  if (!user) return false
  if (user.role === 'admin') return true
  const audience = normalizeAudience(doc.audience)
  if (audience.includes('all')) return true
  return audience.includes(user.department)
}

export function getAssignedModules(modules, user) {
  if (!user || !modules) return []
  if (user.role === 'admin') return modules
  return modules.filter(m => {
    const dept = normalizeDept(m.department)
    return dept.includes('all') || dept.includes(user.department)
  })
}

export function getFilteredDocs(docs, user, department = 'all', type = 'all') {
  if (!docs || !user) return []
  let result = docs.filter(d => canAccessDoc(d, user))
  if (department && department !== 'all')
    result = result.filter(d => d.department === department)
  if (type && type !== 'all')
    result = result.filter(d => d.type === type)
  return result
}
