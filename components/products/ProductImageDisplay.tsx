'use client'

import { useState } from 'react'
import { CubeIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface ProductImageDisplayProps {
  imageUrl?: string
  productName: string
  size?: 'small' | 'medium' | 'large'
  showFallback?: boolean
}

const sizeClasses = {
  small: 'h-24 w-24',
  medium: 'h-48 w-full',
  large: 'h-64 w-full'
}

/**
 * ProductImageDisplay Component
 * 
 * Displays product images with fallback support:
 * - Shows product image when imageUrl is provided
 * - Shows fallback placeholder on image load error
 * - Shows default placeholder when no imageUrl is provided
 * - Supports lazy loading for performance
 * - Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */
export default function ProductImageDisplay({
  imageUrl,
  productName,
  size = 'medium',
  showFallback = true
}: ProductImageDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Show placeholder if no image URL or image failed to load
  const showPlaceholder = !imageUrl || imageError

  if (showPlaceholder && showFallback) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-800 dark:bg-slate-800 light:bg-gray-200 flex items-center justify-center rounded-lg`}>
        <CubeIcon className="w-16 h-16 dark:text-slate-600 light:text-gray-400" />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} relative bg-slate-800 dark:bg-slate-800 light:bg-gray-200 rounded-lg overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={productName}
          className="w-full h-full object-cover"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true)
            setIsLoading(false)
          }}
        />
      )}
    </div>
  )
}
