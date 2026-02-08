'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { complaintService } from '@/services/complaintService'
import { 
  ComplaintCategory, 
  ALL_COMPLAINT_CATEGORIES,
  MIN_DESCRIPTION_LENGTH 
} from '@/types/complaint'
import MediaUploader from './MediaUploader'
import Button from '@/components/ui/Button'

interface ComplaintFormProps {
  token: string
}

interface FormState {
  category: ComplaintCategory | ''
  description: string
  mediaFiles: File[]
}

interface FormErrors {
  category?: string
  description?: string
  media?: string
  submit?: string
}

export default function ComplaintForm({ token }: ComplaintFormProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useLanguage()
  
  const [formState, setFormState] = useState<FormState>({
    category: '',
    description: '',
    mediaFiles: []
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formState.category) {
      newErrors.category = t('complaint.error.categoryRequired')
    }
    
    if (formState.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = t('complaint.error.descriptionMinLength')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState(prev => ({ ...prev, category: e.target.value as ComplaintCategory }))
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: undefined }))
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, description: e.target.value }))
    if (errors.description && e.target.value.trim().length >= MIN_DESCRIPTION_LENGTH) {
      setErrors(prev => ({ ...prev, description: undefined }))
    }
  }

  const handleMediaChange = (files: File[]) => {
    setFormState(prev => ({ ...prev, mediaFiles: files }))
    if (errors.media) {
      setErrors(prev => ({ ...prev, media: undefined }))
    }
  }

  const handleMediaError = (error: string) => {
    setErrors(prev => ({ ...prev, media: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      const result = await complaintService.submitComplaint({
        token,
        category: formState.category as ComplaintCategory,
        description: formState.description,
        mediaAttachments: formState.mediaFiles
      })
      
      // Redirect to success page with reference number
      router.push(`/complaints/success?ref=${result.referenceNumber}`)
    } catch (error) {
      const err = error as { message?: string }
      setErrors({ submit: err.message || t('complaint.error.submitFailed') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const descriptionLength = formState.description.trim().length
  const isDescriptionValid = descriptionLength >= MIN_DESCRIPTION_LENGTH

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Dropdown */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${
          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {t('complaint.form.category')} <span className="text-red-500">*</span>
        </label>
        <select
          value={formState.category}
          onChange={handleCategoryChange}
          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-slate-800/50 border-slate-600/50 text-white'
              : 'bg-white/50 border-gray-300 text-gray-900'
          } ${errors.category ? 'border-red-500' : ''} focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]/50`}
        >
          <option value="">{t('complaint.form.selectCategory')}</option>
          {ALL_COMPLAINT_CATEGORIES.map(category => (
            <option key={category} value={category}>
              {t(`complaint.category.${category}`)}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category}</p>
        )}
      </div>

      {/* Description Textarea */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${
          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {t('complaint.form.description')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formState.description}
          onChange={handleDescriptionChange}
          rows={4}
          placeholder={t('complaint.form.descriptionPlaceholder')}
          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 resize-none ${
            theme === 'dark'
              ? 'bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400'
              : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
          } ${errors.description ? 'border-red-500' : ''} focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]/50`}
        />
        <div className="flex justify-between items-center">
          {errors.description ? (
            <p className="text-sm text-red-500">{errors.description}</p>
          ) : (
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {t('complaint.form.minCharacters').replace('{{min}}', String(MIN_DESCRIPTION_LENGTH))}
            </p>
          )}
          <p className={`text-sm ${
            isDescriptionValid 
              ? 'text-green-500' 
              : theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
          }`}>
            {descriptionLength} / {MIN_DESCRIPTION_LENGTH}+
          </p>
        </div>
      </div>

      {/* Media Uploader */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${
          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
        }`}>
          {t('complaint.form.attachments')}
        </label>
        <MediaUploader
          files={formState.mediaFiles}
          onChange={handleMediaChange}
          onError={handleMediaError}
        />
        {errors.media && (
          <p className="text-sm text-red-500">{errors.media}</p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <p className="text-sm text-red-500">{errors.submit}</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full"
      >
        {t('complaint.form.submit')}
      </Button>
    </form>
  )
}
