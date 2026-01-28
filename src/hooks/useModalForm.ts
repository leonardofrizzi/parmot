import { useState, useCallback } from 'react'

interface UseModalFormReturn {
  loading: boolean
  error: string
  setError: (error: string) => void
  submitForm: <T>(handler: () => Promise<T>) => Promise<T | null>
  reset: () => void
  canClose: boolean
}

export function useModalForm(): UseModalFormReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submitForm = useCallback(async <T>(handler: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError('')

    try {
      const result = await handler()
      setLoading(false)
      return result
    } catch (err) {
      console.error('Erro no formulário:', err)
      const message = err instanceof Error ? err.message : 'Erro ao conectar com o servidor'
      setError(message)
      setLoading(false)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError('')
  }, [])

  return {
    loading,
    error,
    setError,
    submitForm,
    reset,
    canClose: !loading
  }
}
