/**
 * @file src/utils/media.ts
 * @description Centralized helper utility resolving media and uploaded asset URLs against backend origin.
 */

export const getMediaUrl = (path?: string | null): string => {
  if (!path) return ''

  // If already absolute or data URI, return as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }

  // Determine backend origin from VITE_API_BASE_URL (e.g., http://localhost:5000/api/v1 -> http://localhost:5000)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
  let backendOrigin = 'http://localhost:5000'

  try {
    const parsed = new URL(apiBaseUrl, window.location.origin)
    backendOrigin = parsed.origin
  } catch (e) {
    backendOrigin = 'http://localhost:5000'
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${backendOrigin}${cleanPath}`
}
