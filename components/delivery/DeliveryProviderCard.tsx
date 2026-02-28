'use client'

import { DeliveryProvider } from '@/types/delivery'
import { 
  ClockIcon, 
  XCircleIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'

interface DeliveryProviderCardProps {
  provider: DeliveryProvider
  onConfigure: (providerId: string) => void
  onSync: (providerId: string) => Promise<void>
  onRemove: (providerId: string) => void
}

export default function DeliveryProviderCard({ 
  provider, 
  onConfigure,
  onSync,
  onRemove 
}: DeliveryProviderCardProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

  const getProviderIcon = (type: string) => {
    const icons: Record<string, string> = {
      aramex: 'AR',
      dhl: 'DHL',
      fedex: 'FX',
      custom: 'CT'
    }
    return icons[type] || 'CP'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('delivery.neverSynced')
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getSyncStatusBadge = () => {
    if (!provider.lastSyncAt) {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-500`}>
          {t('delivery.notSynced')}
        </span>
      )
    }

    if (provider.lastSyncStatus === 'success') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500`}>
          {t('delivery.syncSuccess')}
        </span>
      )
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500`}>
        {t('delivery.syncFailed')}
      </span>
    )
  }

  return (
    <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Provider Icon */}
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${
            provider.isActive ? 'bg-blue-500' : 'bg-gray-500'
          }`}>
            {getProviderIcon(provider.type)}
          </div>

          {/* Provider Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {provider.name}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                provider.isActive 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-gray-500/20 text-gray-500'
              }`}>
                {provider.isActive ? t('team.active') : t('team.inactive')}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {t('delivery.type')}: {provider.type.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ClockIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {t('delivery.lastSync')}: {formatDate(provider.lastSyncAt)}
                </span>
              </div>

              {provider.lastSyncError && (
                <div className="flex items-center gap-2">
                  <XCircleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-500">
                    {provider.lastSyncError}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="ml-4">
          {getSyncStatusBadge()}
        </div>
      </div>

      {/* Configuration Details */}
      <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'} mb-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ArrowPathIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {t('delivery.autoSync')}
            </span>
          </div>
          <p className="font-semibold">
            {provider.config.autoSync ? t('common.yes') : t('common.no')}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClockIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {t('delivery.syncInterval')}
            </span>
          </div>
          <p className="font-semibold">{provider.config.syncInterval} {t('common.minutes')}</p>
        </div>
      </div>

      {/* Supported Regions */}
      <div className="mb-4">
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-2`}>
          {t('delivery.supportedRegions')}:
        </p>
        <div className="flex flex-wrap gap-2">
          {provider.config.supportedRegions.map((region, index) => (
            <span 
              key={index} 
              className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}
            >
              {region}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onConfigure(provider._id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
            isDark 
              ? 'border-slate-600 hover:bg-slate-700' 
              : 'border-gray-300 hover:bg-gray-100'
          } transition-colors`}
        >
          <Cog6ToothIcon className="w-4 h-4" />
          {t('delivery.configure')}
        </button>

        <button
          onClick={() => onSync(provider._id)}
          disabled={!provider.isActive}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
            provider.isActive
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } transition-colors`}
        >
          <ArrowPathIcon className="w-4 h-4" />
          {t('delivery.syncNow')}
        </button>

        <button
          onClick={() => onRemove(provider._id)}
          className={`px-4 py-2 rounded-lg ${
            isDark 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          } transition-colors`}
        >
          {t('common.remove')}
        </button>
      </div>
    </div>
  )
}
