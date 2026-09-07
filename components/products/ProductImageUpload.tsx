'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpTrayIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import ProductImageDisplay from './ProductImageDisplay'

interface ProductImageUploadProps {
  currentImageUrl?: string
  productName: string
  selectedFile: File | null
  removalPending?: boolean
  onFileSelect: (file: File | null) => void
  onRemoveCurrent: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
]

export default function ProductImageUpload({
  currentImageUrl,
  productName,
  selectedFile,
  removalPending = false,
  onFileSelect,
  onRemoveCurrent
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    setError(null)

    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format non autorisé. Utilisez une image JPG, JPEG, PNG ou WEBP.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('L’image ne doit pas dépasser 5 Mo.')
      event.target.value = ''
      return
    }

    onFileSelect(file)
  }

  const clearSelectedFile = () => {
    onFileSelect(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold dark:text-white light:text-gray-900">
        Image du produit
      </label>

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative">
            <ProductImageDisplay
              imageUrl={previewUrl}
              productName={productName || 'Produit'}
              size="medium"
            />

            <button
              type="button"
              onClick={clearSelectedFile}
              className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors"
              title="Supprimer l’image sélectionnée"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <PhotoIcon className="w-5 h-5" />
            <span className="truncate">{selectedFile?.name}</span>
          </div>
        </div>
      ) : currentImageUrl ? (
        <div className="space-y-3">
          <div className="relative">
            <ProductImageDisplay
              imageUrl={currentImageUrl}
              productName={productName || 'Produit'}
              size="medium"
            />

            <button
              type="button"
              onClick={onRemoveCurrent}
              className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors"
              title="Supprimer l’image actuelle"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed dark:border-slate-600 light:border-gray-300 p-6 text-center">
          <PhotoIcon className="w-12 h-12 mx-auto mb-3 dark:text-slate-500 light:text-gray-400" />

          <p className="text-sm dark:text-slate-300 light:text-gray-700">
            Aucune image sélectionnée
          </p>

          <p className="text-xs mt-1 dark:text-slate-500 light:text-gray-500">
            Une image par défaut sera affichée si aucune image n’est ajoutée.
          </p>
        </div>
      )}

      {removalPending && !selectedFile && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
          L’image actuelle sera supprimée lors de l’enregistrement.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 dark:border-slate-600 light:border-gray-300 dark:hover:bg-slate-800 light:hover:bg-gray-50 transition-colors font-medium"
      >
        <ArrowUpTrayIcon className="w-5 h-5" />
        {currentImageUrl && !selectedFile
          ? 'Remplacer l’image'
          : selectedFile
            ? 'Choisir une autre image'
            : 'Importer une image'}
      </button>

      <p className="text-xs dark:text-slate-400 light:text-gray-600">
        Formats acceptés : JPG, JPEG, PNG, WEBP — 5 Mo maximum.
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
