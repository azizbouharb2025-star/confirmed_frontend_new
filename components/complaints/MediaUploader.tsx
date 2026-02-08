'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { 
  ALLOWED_MEDIA_TYPES, 
  MAX_MEDIA_SIZE_BYTES,
  isValidMediaType,
  calculateTotalMediaSize 
} from '@/types/complaint'
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  PhotoIcon, 
  VideoCameraIcon 
} from '@heroicons/react/24/outline'

interface MediaUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  onError: (error: string) => void
}

interface FilePreview {
  file: File
  preview: string
  type: 'image' | 'video'
}

export default function MediaUploader({ files, onChange, onError }: MediaUploaderProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateFiles = useCallback((newFiles: File[]): File[] => {
    const validFiles: File[] = []
    
    for (const file of newFiles) {
      // Check file type
      if (!isValidMediaType(file.type)) {
        onError(t('complaint.error.invalidFileType'))
        continue
      }
      validFiles.push(file)
    }
    
    // Check total size including existing files
    const allFiles = [...files, ...validFiles]
    const totalSize = calculateTotalMediaSize(allFiles)
    
    if (totalSize > MAX_MEDIA_SIZE_BYTES) {
      onError(t('complaint.error.fileSizeExceeded').replace('{{max}}', formatFileSize(MAX_MEDIA_SIZE_BYTES)))
      return []
    }
    
    return validFiles
  }, [files, onError, t])

  const createPreviews = useCallback((newFiles: File[]): FilePreview[] => {
    return newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }))
  }, [])

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles = validateFiles(fileArray)
    
    if (validFiles.length > 0) {
      // Simulate upload progress
      validFiles.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        // Simulate progress
        let progress = 0
        const interval = setInterval(() => {
          progress += Math.random() * 30
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
          }
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        }, 200)
      })
      
      const newPreviews = createPreviews(validFiles)
      setPreviews(prev => [...prev, ...newPreviews])
      onChange([...files, ...validFiles])
    }
  }, [files, onChange, validateFiles, createPreviews])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const handleRemoveFile = useCallback((index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index].preview)
    
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    
    setPreviews(newPreviews)
    onChange(newFiles)
  }, [files, previews, onChange])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const totalSize = calculateTotalMediaSize(files)
  const remainingSize = MAX_MEDIA_SIZE_BYTES - totalSize

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ 
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? '#ADFF2F' : undefined
        }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800/30 border-slate-600 hover:border-slate-500'
            : 'bg-gray-50 border-gray-300 hover:border-gray-400'
        } ${isDragging ? 'border-[#ADFF2F] bg-[#ADFF2F]/5' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_MEDIA_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center text-center">
          <CloudArrowUpIcon className={`w-12 h-12 mb-4 ${
            isDragging ? 'text-[#ADFF2F]' : theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
          }`} />
          <p className={`text-sm font-medium mb-1 ${
            theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
          }`}>
            {t('complaint.form.dragDrop')}
          </p>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
          }`}>
            {t('complaint.form.supportedFormats')}
          </p>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
          }`}>
            {t('complaint.form.maxSize').replace('{{size}}', formatFileSize(MAX_MEDIA_SIZE_BYTES))}
          </p>
        </div>
      </motion.div>

      {/* Size indicator */}
      {files.length > 0 && (
        <div className="flex justify-between items-center text-xs">
          <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}>
            {t('complaint.form.totalSize')}: {formatFileSize(totalSize)}
          </span>
          <span className={remainingSize < MAX_MEDIA_SIZE_BYTES * 0.1 
            ? 'text-orange-500' 
            : theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
          }>
            {t('complaint.form.remaining')}: {formatFileSize(remainingSize)}
          </span>
        </div>
      )}

      {/* File Previews */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {previews.map((preview, index) => (
              <motion.div
                key={preview.file.name + index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`relative rounded-xl overflow-hidden aspect-square ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                }`}
              >
                {preview.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.preview}
                    alt={preview.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={preview.preview}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <VideoCameraIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Upload progress overlay */}
                {uploadProgress[preview.file.name] !== undefined && 
                 uploadProgress[preview.file.name] < 100 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-3/4">
                      <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress[preview.file.name]}%` }}
                          className="h-full bg-[#ADFF2F]"
                        />
                      </div>
                      <p className="text-white text-xs text-center mt-1">
                        {Math.round(uploadProgress[preview.file.name])}%
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile(index)
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
                
                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-xs truncate">{preview.file.name}</p>
                  <p className="text-white/70 text-xs">{formatFileSize(preview.file.size)}</p>
                </div>
                
                {/* Type indicator */}
                <div className="absolute top-2 left-2">
                  {preview.type === 'image' ? (
                    <PhotoIcon className="w-5 h-5 text-white drop-shadow" />
                  ) : (
                    <VideoCameraIcon className="w-5 h-5 text-white drop-shadow" />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
