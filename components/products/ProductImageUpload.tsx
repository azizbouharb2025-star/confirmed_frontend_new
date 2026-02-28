'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/hooks/useLanguage'
import ProductImageDisplay from './ProductImageDisplay'

interface ProductImageUploadProps {
  currentImageUrl?: string
  productName: string
  onUpload: (imageUrl: string) => Promise<void>
  onRemove: () => Promise<void>
}

/**
 * ProductImageUpload Component
 * 
 * Provides image upload functionality with:
 * - URL input for image upload (MVP approach)
 * - Image format validation (JPEG, PNG, WebP, GIF)
 * - Preview before upload
 * - Remove image functionality
 * - Validates: Requirements 4.6, 4.7
 */
export default function ProductImageUpload({
  currentImageUrl,
  productName,
  onUpload,
  onRemove
}: ProductImageUploadProps) {
  const { t } = useLanguage()
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateImageUrl = (url: string): boolean => {
    // Validate URL format
    try {
      new URL(url)
    } catch {
      setError(t('products.invalidImageUrl'))
      return false
    }

    // Validate image format
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const urlLower = url.toLowerCase()
    const hasValidExtension = validExtensions.some(ext => urlLower.includes(ext))
    
    if (!hasValidExtension) {
      setError(t('products.invalidImageFormat'))
      return false
    }

    return true
  }

  const handlePreview = () => {
    setError(null)
    if (!imageUrl.trim()) {
      setError(t('products.imageUrlRequired'))
      return
    }

    if (validateImageUrl(imageUrl)) {
      setPreviewUrl(imageUrl)
    }
  }

  const handleUpload = async () => {
    if (!previewUrl) {
      setError(t('products.previewFirst'))
      return
    }

    setUploading(true)
    setError(null)

    try {
      await onUpload(previewUrl)
      setImageUrl('')
      setPreviewUrl(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(t('products.confirmRemoveImage'))) return

    setRemoving(true)
    setError(null)

    try {
      await onRemove()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('products.removeFailed'))
    } finally {
      setRemoving(false)
    }
  }

  const handleCancelPreview = () => {
    setPreviewUrl(null)
    setImageUrl('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {currentImageUrl && !previewUrl && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold dark:text-white light:text-gray-900">
            {t('products.currentImage')}
          </label>
          <div className="relative">
            <ProductImageDisplay
              imageUrl={currentImageUrl}
              productName={productName}
              size="medium"
            />
            <button
              onClick={handleRemove}
              disabled={removing}
              className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
              title={t('products.removeImage')}
            >
              {removing ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <XMarkIcon className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Display */}
      {previewUrl && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold dark:text-white light:text-gray-900">
            {t('products.imagePreview')}
          </label>
          <div className="relative">
            <ProductImageDisplay
              imageUrl={previewUrl}
              productName={productName}
              size="medium"
            />
            <button
              onClick={handleCancelPreview}
              className="absolute top-2 right-2 p-2 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
              title={t('common.cancel')}
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                {t('products.uploading')}
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-5 h-5" />
                {t('products.uploadImage')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Form */}
      {!previewUrl && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold dark:text-white light:text-gray-900">
            {currentImageUrl ? t('products.changeImage') : t('products.uploadImage')}
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                setError(null)
              }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-gray-50 border-2 dark:border-slate-600 light:border-gray-300 focus:border-blue-500 dark:text-white light:text-gray-900 placeholder:opacity-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <button
              onClick={handlePreview}
              disabled={!imageUrl.trim()}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs dark:text-slate-400 light:text-gray-600">
            {t('products.supportedFormats')}: JPEG, PNG, WebP, GIF
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
