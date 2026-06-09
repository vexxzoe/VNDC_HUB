import { useState, useMemo } from 'react'
import { searchDocs } from '@/utils/synonymSearch'
import { getFilteredDocs } from '@/utils/permissions'
import { useAuth } from '@/context/AuthContext'

/**
 * Custom hook quản lý trạng thái và kết quả tìm kiếm tài liệu
 */
export function useDocSearch(allDocs) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [type, setType] = useState('all')

  const results = useMemo(() => {
    const permFiltered = getFilteredDocs(allDocs, user, department, type)
    return searchDocs(permFiltered, query)
  }, [allDocs, user, query, department, type])

  return { query, setQuery, department, setDepartment, type, setType, results }
}
