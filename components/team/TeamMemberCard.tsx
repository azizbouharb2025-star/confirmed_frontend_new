'use client'

import { TeamMember } from '@/types/team'
import { EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'

interface TeamMemberCardProps {
  member: TeamMember
  onResendInvite?: (memberId: string) => void
  onCancelInvite?: (memberId: string) => void
  onRemove?: (memberId: string) => void
}

export default function TeamMemberCard({ 
  member, 
  onResendInvite, 
  onCancelInvite,
  onRemove 
}: TeamMemberCardProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

  const getStatusBadge = (status: string) => {
    const badges = {
      invited: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-500',
        label: t('team.invited')
      },
      pending: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-500',
        label: t('team.pending')
      },
      confirmed: {
        bg: 'bg-green-500/20',
        text: 'text-green-500',
        label: t('team.confirmed')
      }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {getInitials(member.name, member.email)}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {member.name || member.email}
              </h3>
              {getStatusBadge(member.status)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {t(`team.role.${member.role}`)}
                </span>
              </div>

              {member.email && (
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {member.email}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ClockIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {t('team.invitedOn')}: {formatDate(member.invitedAt)}
                </span>
              </div>

              {member.acceptedAt && (
                <div className="flex items-center gap-2">
                  <ClockIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {t('team.acceptedOn')}: {formatDate(member.acceptedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          {member.status === 'pending' && onResendInvite && (
            <button
              onClick={() => onResendInvite(member._id)}
              className={`px-3 py-1 text-xs rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition-colors`}
            >
              {t('team.resendInvite')}
            </button>
          )}

          {member.status === 'pending' && onCancelInvite && (
            <button
              onClick={() => onCancelInvite(member._id)}
              className={`px-3 py-1 text-xs rounded-lg ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}
            >
              {t('team.cancelInvite')}
            </button>
          )}

          {member.status === 'confirmed' && onRemove && (
            <button
              onClick={() => onRemove(member._id)}
              className={`px-3 py-1 text-xs rounded-lg ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}
            >
              {t('team.remove')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
