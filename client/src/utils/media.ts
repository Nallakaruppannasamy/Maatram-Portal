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

  // Optimize Cloudinary URLs with safe on-the-fly thumbnail and facial focus transformation
  if (resolved.includes('res.cloudinary.com') && resolved.includes('/upload/')) {
    const transform = `c_thumb,g_face,w_${width},h_${height},q_auto,f_auto`

    // Extract base upload prefix and the remaining asset identifier/version
    const parts = resolved.split('/upload/')
    if (parts.length === 2) {
      const base = parts[0] + '/upload/'
      const remainder = parts[1]

      // Check if remainder already starts with a transformation block (e.g. c_..., w_...)
      const remainderParts = remainder.split('/')
      if (remainderParts.length > 1 && (remainderParts[0].includes('c_') || remainderParts[0].includes('w_') || remainderParts[0].includes('g_'))) {
        // Replace existing transform block with target transform
        remainderParts[0] = transform
        return `${base}${remainderParts.join('/')}`
      }

      return `${base}${transform}/${remainder}`
    }
  }

  return resolved
}
