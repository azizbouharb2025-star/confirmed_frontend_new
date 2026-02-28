'use client'

import { useState, useEffect } from 'react'
import { DeliveryProvider, DeliveryProviderType } from '@/types/delivery'
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'

interface DeliveryProviderConfigModalProps {
  isOpen: boolean
  provider: DeliveryProvider | null
  onClose: () => void
  onSave: (config: {
    name: string
    type: DeliveryProviderType
    apiEndpoint: string
    apiKey: string
    apiSecret?: string
    autoSync: boolean
    syncInterval: number
    supportedRegions: string[]
  }) => Promise<void>
}

export default function DeliveryProviderConfigModal({
  isOpen,
  provider,
  onClose,
  onSave
}: DeliveryProviderConfigModalProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

  const [formData, setFormData] = useState({
    name: '',
    type: 'custom' as DeliveryProviderType,
    apiEndpoint: '',
    apiKey: '',
    apiSecret: '',
    autoSync: true,
    syncInterval: 30,
    supportedRegions: ''
  })

  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        type: provider.type,
        apiEndpoint: provider.apiEndpoint,
        apiKey: '', // Don't populate for security
        apiSecret: '',
        autoSync: provider.config.autoSync,
        syncInterval: provider.config.syncInterval,
        supportedRegions: provider.config.supportedRegions.join(', ')
      })
    } else {
      // Reset form for new provider
      setFormData({
        name: '',
        type: 'custom',
        apiEndpoint: '',
        apiKey: '',
        apiSecret: '',
        autoSync: true,
        syncInterval: 30,
        supportedRegions: ''
      })
    }
    setConnectionStatus('idle')
  }, [provider, isOpen])

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus('idle')

    // Simulate API connection test
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock: Random success/failure for demo
    const success = Math.random() > 0.3
    setConnectionStatus(success ? 'success' : 'failed')
    setTestingConnection(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        name: formData.name,
        type: formData.type,
        apiEndpoint: formData.apiEndpoint,
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret || undefined,
        autoSync: formData.autoSync,
        syncInterval: formData.syncInterval,
        supportedRegions: formData.supportedRegions
          .split(',')
          .map(r => r.trim())
          .filter(r => r)
      })
      onClose()
    } catch (error) {
      console.error('Failed to save provider:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 ${isDark ? 'bg-slate-800' : 'bg-white'} border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} p-6 flex items-center justify-between`}>
          <h2 className="text-xl font-semibold">
            {provider ? t('delivery.editProvider') : t('delivery.addProvider')}
          </h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Provider Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('delivery.providerName')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., Aramex Morocco"
            />
          </div>

          {/* Provider Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('delivery.providerType')} *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as DeliveryProviderType })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="aramex">Aramex</option>
              <option value="dhl">DHL</option>
              <option value="fedex">FedEx</option>
              <option value="custom">{t('delivery.custom')}</option>
            </select>
          </div>

          {/* API Endpoint */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('delivery.apiEndpoint')} *
            </label>
            <input
              type="url"
              required
              value={formData.apiEndpoint}
              onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="https://api.provider.com/v1"
            />
          </div>

          {/* API Key */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('delivery.apiKey')} *
            </label>
            <input
              type="password"
              required={!provider}
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={provider ? t('delivery.leaveBlankToKeep') : ''}
            />
          </div>

          {/* API Secret (Optional) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('delivery.apiSecret')} ({t('common.optional')})
            </label>
            <input
              type="password"
              value={formData.apiSecret}
              onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={provider ? t('delivery.leaveBlankToKeep') : ''}
            />
          </div>

          {/* Test Connection Button */}
          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || !formData.apiEndpoint || !formData.apiKey}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'border-slate-600 hover:bg-slate-700' 
                  : 'border-gray-300 hover:bg-gray-100'
              } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {testingConnection ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  {t('delivery.testing')}
                </>
              ) : (
                <>
                  {connectionStatus === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                  {connectionStatus === 'failed' && <XCircleIcon className="w-5 h-5 text-red-500" />}
                  {t('delivery.testConnection')}
                </>
              )}
            </button>
            {connectionStatus === 'success' && (
              <p className="text-sm text-green-500 mt-2">{t('delivery.connectionSuccess')}</p>
            )}
            {connectionStatus === 'failed' && (
              <p className="text-sm text-red-500 mt-2">{t('delivery.connectionFailed')}</p>
            )}
          </div>

          {/* Auto Sync */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoSync"
              checked={formData.autoSync}
              onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="autoSync" className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('delivery.enableAutoSync')}
            </label>
          </div>

          {/* Sync Interval */}
          {formData.autoSync && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('delivery.syncInterval')} ({t('common.minutes')}) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="1440"
                value={formData.syncInterval}
                onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t('delivery.syncIntervalHelp')}
              </p>
            </div>
          )}

          {/* Supported Regions */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t('delivery.supportedRegions')} *
            </label>
            <input
              type="text"
              required
              value={formData.supportedRegions}
              onChange={(e) => setFormData({ ...formData, supportedRegions: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Casablanca, Rabat, Marrakech"
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {t('delivery.regionsHelp')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'border-slate-600 hover:bg-slate-700' 
                  : 'border-gray-300 hover:bg-gray-100'
              } transition-colors`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
