import { useState, useMemo } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
  totalItems?: number
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  totalItems = 0,
}: UsePaginationOptions = {}) {
  const [page, setPage] = useState<number>(initialPage)
  const [limit, setLimit] = useState<number>(initialLimit)
  const [total, setTotal] = useState<number>(totalItems)

  const totalPages = useMemo(() => {
    return Math.ceil(total / limit) || 1
  }, [total, limit])

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages))
  const prevPage = () => setPage((p) => Math.max(p - 1, 1))

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
