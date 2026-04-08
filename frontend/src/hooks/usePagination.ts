import { useState, useMemo, useEffect } from 'react'

export function usePagination<T>(data: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset page when data changes or shrinks
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [data.length, totalPages, currentPage])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return data.slice(start, end)
  }, [data, currentPage, itemsPerPage])

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1)
  }

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  return {
    currentPage,
    totalPages,
    paginatedData,
    nextPage,
    prevPage,
    goToPage,
    hasMore: currentPage < totalPages,
    hasLess: currentPage > 1,
    totalItems: data.length
  }
}
