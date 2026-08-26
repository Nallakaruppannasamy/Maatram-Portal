import React, { useState } from 'react'
import { User } from 'lucide-react'
import { getThumbnailUrl } from '@/utils/media'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

const iconSizes = {
  xs: 12,
  sm: 15,
  md: 18,
  lg: 22,
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  size = 'sm',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false)
  const resolvedUrl = src ? getThumbnailUrl(src, 96, 96) : ''

  React.useEffect(() => {
    setHasError(false)
  }, [src])

  const getInitials = (n?: string): string => {
    if (!n) return ''
    const parts = n.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(name)

  if (resolvedUrl && !hasError) {
    return (
      <div
        className={`relative inline-block rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-100 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 border border-amber-200 bg-amber-50 text-amber-900 font-bold select-none ${sizeClasses[size]} ${className}`}
      title={name || alt}
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <User size={iconSizes[size]} className="text-amber-700" />
      )}
    </div>
  )
}
