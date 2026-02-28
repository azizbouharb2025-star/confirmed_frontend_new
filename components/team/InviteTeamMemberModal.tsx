'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { TeamMemberRole } from '@/types/team'

interface InviteTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (email: string, role: TeamMemberRole) => Promise<void>
}

export default function InviteTeamMemberModal({ isOpen, onClose, onInvite }: InviteTeamMemberModalProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamMemberRole>('operator')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t('team.invalidEmail'))
      return
    }

    setIsSubmitting(true)
    try {
      await onInvite(email, role)
      // Reset form
      setEmail('')
      setRole('operator')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('team.inviteError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('')
      setRole('operator')
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} max-w-md w-full p-6 shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('team.inviteMember')}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-colors disabled:opacity-50`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('team.inviteEmail')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@example.com"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            />
          </div>

          {/* Role Select */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('team.selectRole')}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamMemberRole)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            >
              <option value="operator">{t('team.role.operator')}</option>
              <option value="manager">{t('team.role.manager')}</option>
              <option value="admin">{t('team.role.admin')}</option>
            </select>
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {t('team.roleDescription')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'border-slate-600 hover:bg-slate-700' 
                  : 'border-gray-300 hover:bg-gray-100'
              } transition-colors disabled:opacity-50`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('team.sending')}
                </>
              ) : (
                t('team.sendInvite')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
