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

/**
 * Transforms an image URL to an optimized thumbnail URL.
 * Automatically injects Cloudinary dynamic thumbnail transforms (c_thumb,g_face,w,h,q_auto,f_auto)
 * when dealing with Cloudinary URLs to prevent downloading huge raw originals in directory lists.
 */
export const getThumbnailUrl = (
  path?: string | null,
  width: number = 80,
  height: number = 80
): string => {
  if (!path) return ''

  const resolved = getMediaUrl(path)
  if (!resolved) return ''

  // Optimize Cloudinary URLs with on-the-fly thumbnail and facial focus transformation
  if (resolved.includes('res.cloudinary.com') && resolved.includes('/upload/')) {
    const transform = `c_thumb,g_face,w_${width},h_${height},q_auto,f_auto`
    // Ensure we don't duplicate transformations
    if (!resolved.includes(transform)) {
      return resolved.replace('/upload/', `/upload/${transform}/`)
    }
  }

  return resolved
}
