'use client'

import { Operator } from '@/types/team'
import { EnvelopeIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'

interface OperatorCardProps {
  operator: Operator
  showPerformanceMetrics?: boolean
}

export default function OperatorCard({ operator, showPerformanceMetrics = true }: OperatorCardProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

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
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getConfirmationRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-500'
    if (rate >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {getInitials(operator.name, operator.email)}
        </div>

        {/* Operator Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {operator.name || operator.email}
            </h3>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
              {t('team.active')}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t(`team.role.${operator.role}`)}
              </span>
            </div>

            {operator.email && (
              <div className="flex items-center gap-2">
                <EnvelopeIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {operator.email}
                </span>
              </div>
            )}

            {operator.lastActiveAt && (
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {t('team.lastActive')}: {formatDate(operator.lastActiveAt)}
                </span>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {showPerformanceMetrics && operator.performanceMetrics && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <ChartBarIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {t('team.performanceMetrics')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {t('team.totalCalls')}
                  </p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {operator.performanceMetrics.totalCalls}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {t('team.confirmedCalls')}
                  </p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {operator.performanceMetrics.confirmedCalls}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {t('team.confirmationRate')}
                  </p>
                  <p className={`text-lg font-semibold ${getConfirmationRateColor(operator.performanceMetrics.confirmationRate)}`}>
                    {operator.performanceMetrics.confirmationRate.toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {t('team.avgCallDuration')}
                  </p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {Math.floor(operator.performanceMetrics.averageCallDuration / 60)}m {operator.performanceMetrics.averageCallDuration % 60}s
                  </p>
                </div>
              </div>

              {operator.performanceMetrics.lastCallAt && (
                <div className="mt-3">
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {t('team.lastCall')}: {formatDate(operator.performanceMetrics.lastCallAt)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
