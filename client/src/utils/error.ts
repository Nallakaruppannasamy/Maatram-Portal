/**
 * Extracts a human-friendly, specific error message from an API error response.
 * Handles Zod validation error arrays, backend ApiError message fields, and network errors.
 */
export function getApiErrorMessage(err: any, fallback = 'An unexpected error occurred'): string {
  if (!err) return fallback

  const data = err.response?.data

  // 1. If detailed validation errors array exists (from Zod or ApiError)
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const errorStrings = data.errors
      .map((item: any) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          if (item.message) return item.message
          if (item.field && item.error) return `${item.field}: ${item.error}`
        }
        return null
      })
      .filter(Boolean)

    if (errorStrings.length > 0) {
      // Return joined error messages or first message
      return errorStrings.join('. ')
    }
  }

  // 2. Specific backend message if present
  if (data?.message && typeof data.message === 'string' && data.message.trim() !== '') {
    return data.message
  }

  // 3. Error field if string
  if (data?.error && typeof data.error === 'string' && data.error.trim() !== '') {
    return data.error
  }

  // 4. Standard axios / javascript error message
  if (err.message && typeof err.message === 'string' && err.message.trim() !== '') {
    return err.message
  }

  return fallback
}
