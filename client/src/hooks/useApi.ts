import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T = any>(apiFunc: (...args: any[]) => Promise<any>) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState({ data: null, loading: true, error: null })
      try {
        const response = await apiFunc(...args)
        const resultData = response?.data !== undefined ? response.data : response
        setState({ data: resultData, loading: false, error: null })
        return resultData
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || 'An error occurred during API execution'
        setState({ data: null, loading: false, error: errorMessage })
        throw err
      }
    },
    [apiFunc]
  )

  return {
    ...state,
    execute,
  }
}
