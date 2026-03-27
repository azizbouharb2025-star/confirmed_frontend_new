'use client'

import { useState, useEffect } from 'react'
import { DeliveryProvider, DeliveryProviderType } from '@/types/delivery'
import { TruckIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { SkeletonCard, SkeletonList } from '@/components/ui/SkeletonLoader'
import DeliveryProviderCard from './DeliveryProviderCard'
import DeliveryProviderConfigModal from './DeliveryProviderConfigModal'

interface DeliveryCompanyPanelProps {
  shopId: string
}

export default function DeliveryCompanyPanel({ shopId }: DeliveryCompanyPanelProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

  const [providers, setProviders] = useState<DeliveryProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider | null>(null)
  const [_syncing, setSyncing] = useState<string | null>(null)

  // Load providers on mount
  useEffect(() => {
    loadProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId])

  const loadProviders = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/delivery/providers?shopId=${shopId}`)
      // const data = await response.json()
      // setProviders(data.providers)

      // Mock data for now
      const mockProviders: DeliveryProvider[] = [
        {
          _id: 'provider_1',
          shopId,
          name: 'Aramex Tunisie',
          type: 'aramex',
          apiEndpoint: 'https://api.aramex.com/v1',
          apiKey: 'encrypted_key_123',
          apiSecret: 'encrypted_secret_456',
          isActive: true,
          lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastSyncStatus: 'success',
          config: {
            autoSync: true,
            syncInterval: 30,
            supportedRegions: ['Tunis', 'Ariana', 'Ben Arous', 'Sousse', 'Sfax', 'Nabeul']
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 'provider_2',
          shopId,
          name: 'DHL Express',
          type: 'dhl',
          apiEndpoint: 'https://api.dhl.com/v2',
          apiKey: 'encrypted_key_789',
          isActive: false,
          lastSyncAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          lastSyncStatus: 'failed',
          lastSyncError: 'Authentication failed',
          config: {
            autoSync: false,
            syncInterval: 60,
            supportedRegions: ['All Tunisia']
          },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      setProviders(mockProviders)
    } catch (error) {
      console.error('Failed to load providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProvider = () => {
    setSelectedProvider(null)
    setShowModal(true)
  }

  const handleConfigureProvider = (providerId: string) => {
    const provider = providers.find(p => p._id === providerId)
    if (provider) {
      setSelectedProvider(provider)
      setShowModal(true)
    }
  }

  const handleSaveProvider = async (config: {
    name: string
    type: DeliveryProviderType
    apiEndpoint: string
    apiKey: string
    apiSecret?: string
    autoSync: boolean
    syncInterval: number
    supportedRegions: string[]
  }) => {
    try {
      if (selectedProvider) {
        // Update existing provider
        // TODO: Replace with actual API call
        // await fetch(`/api/delivery/providers/${selectedProvider._id}`, {
        //   method: 'PATCH',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(config)
        // })

        setProviders(prev => prev.map(p => 
          p._id === selectedProvider._id 
            ? {
                ...p,
                name: config.name,
                type: config.type,
                apiEndpoint: config.apiEndpoint,
                config: {
                  autoSync: config.autoSync,
                  syncInterval: config.syncInterval,
                  supportedRegions: config.supportedRegions
                },
                updatedAt: new Date().toISOString()
              }
            : p
        ))
      } else {
        // Create new provider
        // TODO: Replace with actual API call
        // const response = await fetch('/api/delivery/providers', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ ...config, shopId })
        // })
        // const data = await response.json()

        const newProvider: DeliveryProvider = {
          _id: `provider_${Date.now()}`,
          shopId,
          name: config.name,
          type: config.type,
          apiEndpoint: config.apiEndpoint,
          apiKey: config.apiKey,
          apiSecret: config.apiSecret,
          isActive: true,
          config: {
            autoSync: config.autoSync,
            syncInterval: config.syncInterval,
            supportedRegions: config.supportedRegions
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setProviders(prev => [...prev, newProvider])
      }
    } catch (error) {
      console.error('Failed to save provider:', error)
      throw error
    }
  }

  const handleSyncProvider = async (providerId: string) => {
    setSyncing(providerId)
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/delivery/sync/${providerId}`, { method: 'POST' })

      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000))

      setProviders(prev => prev.map(p => 
        p._id === providerId 
          ? {
              ...p,
              lastSyncAt: new Date().toISOString(),
              lastSyncStatus: 'success' as const,
              lastSyncError: undefined
            }
          : p
      ))
    } catch (error) {
      console.error('Failed to sync provider:', error)
      setProviders(prev => prev.map(p => 
        p._id === providerId 
          ? {
              ...p,
              lastSyncAt: new Date().toISOString(),
              lastSyncStatus: 'failed' as const,
              lastSyncError: 'Sync failed'
            }
          : p
      ))
    } finally {
      setSyncing(null)
    }
  }

  const handleRemoveProvider = async (providerId: string) => {
    if (!confirm(t('delivery.confirmRemove'))) return

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/delivery/providers/${providerId}`, { method: 'DELETE' })

      setProviders(prev => prev.filter(p => p._id !== providerId))
    } catch (error) {
      console.error('Failed to remove provider:', error)
    }
  }

  const activeCount = providers.filter(p => p.isActive).length
  const lastSyncSuccess = providers.filter(p => p.lastSyncStatus === 'success').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonList items={2} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('delivery.totalProviders')}
              </p>
              <p className="text-3xl font-bold mt-1">{providers.length}</p>
            </div>
            <TruckIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('delivery.activeProviders')}
              </p>
              <p className="text-3xl font-bold mt-1 text-green-500">{activeCount}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
              <span className="text-green-500 font-bold text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('delivery.successfulSyncs')}
              </p>
              <p className="text-3xl font-bold mt-1 text-blue-500">{lastSyncSuccess}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
              <span className="text-blue-500 font-bold text-2xl">↻</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Provider Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddProvider}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('delivery.addProvider')}
        >
          <PlusIcon className="w-5 h-5" />
          {t('delivery.addProvider')}
        </button>
      </div>

      {/* Providers List */}
      {providers.length === 0 ? (
        <div className={`p-12 rounded-lg border-2 border-dashed ${isDark ? 'border-slate-700' : 'border-gray-300'} text-center`}>
          <TruckIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t('delivery.noProviders')}
          </h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-4`}>
            {t('delivery.noProvidersDescription')}
          </p>
          <button
            onClick={handleAddProvider}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={t('delivery.addFirstProvider')}
          >
            {t('delivery.addFirstProvider')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map(provider => (
            <DeliveryProviderCard
              key={provider._id}
              provider={provider}
              onConfigure={handleConfigureProvider}
              onSync={handleSyncProvider}
              onRemove={handleRemoveProvider}
            />
          ))}
        </div>
      )}

      {/* Config Modal */}
      <DeliveryProviderConfigModal
        isOpen={showModal}
        provider={selectedProvider}
        onClose={() => {
          setShowModal(false)
          setSelectedProvider(null)
        }}
        onSave={handleSaveProvider}
      />
    </div>
  )
}
