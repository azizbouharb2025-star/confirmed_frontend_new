'use client'

import { useState, useEffect } from 'react'
import { BuildingStorefrontIcon, PlusIcon, ShoppingBagIcon, DevicePhoneMobileIcon, ShoppingCartIcon, GlobeAltIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import logger from '@/lib/logger'

interface Shop {
  _id: string
  name: string
  domain: string
  platform: string
  isActive: boolean
  settings?: { callPriority: string; productSyncEnabled: boolean; webhookEnabled: boolean }
  subscriptionId?: { plan: string; status: string }
  createdAt: string
}

interface ShopFormData {
  name: string
  domain: string
  platform: string
  apiCredentials: Record<string, string>
}

const platforms = [
  { id: 'converty', name: 'Converty', Icon: ShoppingBagIcon },
  { id: 'meta', name: 'Meta (Facebook/Instagram)', Icon: DevicePhoneMobileIcon },
  { id: 'tiktakpro', name: 'TikTakPro', Icon: ShoppingCartIcon },
  { id: 'shopify', name: 'Shopify', Icon: ShoppingBagIcon },
  { id: 'woocommerce', name: 'WooCommerce', Icon: ShoppingCartIcon },
  { id: 'custom', name: 'Custom Website', Icon: GlobeAltIcon }
]

const initialFormData: ShopFormData = {
  name: '',
  domain: '',
  platform: '',
  apiCredentials: {}
}

export default function ShopsPage() {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<ShopFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})


  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/shops')
      if (Array.isArray(response.data)) {
        setShops(response.data)
      } else if (response.data?.shops) {
        setShops(response.data.shops)
      }
    } catch (err) {
      logger.error('Failed to fetch shops:', err, 'Shops')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = t('shops.nameRequired')
    if (!formData.domain.trim()) errors.domain = t('shops.domainRequired')
    if (!formData.platform) errors.platform = t('shops.platformRequired')

    const creds = formData.apiCredentials
    if (formData.platform === 'converty') {
      if (!creds.apiKey) errors.apiKey = t('shops.apiKeyRequired')
      if (!creds.apiSecret) errors.apiSecret = t('shops.apiSecretRequired')
      if (!creds.storeUrl) errors.storeUrl = t('shops.storeUrlRequired')
    } else if (formData.platform === 'shopify') {
      if (!creds.apiKey) errors.apiKey = t('shops.apiKeyRequired')
      if (!creds.apiSecret) errors.apiSecret = t('shops.apiSecretRequired')
      if (!creds.storeUrl) errors.storeUrl = t('shops.storeUrlRequired')
    } else if (formData.platform === 'woocommerce') {
      if (!creds.consumerKey) errors.consumerKey = t('shops.consumerKeyRequired')
      if (!creds.consumerSecret) errors.consumerSecret = t('shops.consumerSecretRequired')
      if (!creds.storeUrl) errors.storeUrl = t('shops.storeUrlRequired')
    } else if (formData.platform === 'meta') {
      if (!creds.appId) errors.appId = t('shops.appIdRequired')
      if (!creds.appSecret) errors.appSecret = t('shops.appSecretRequired')
      if (!creds.pageId) errors.pageId = t('shops.pageIdRequired')
    } else if (formData.platform === 'tiktakpro') {
      if (!creds.apiKey) errors.apiKey = t('shops.apiKeyRequired')
      if (!creds.apiSecret) errors.apiSecret = t('shops.apiSecretRequired')
      if (!creds.shopId) errors.shopId = t('shops.shopIdRequired')
    } else if (formData.platform === 'custom') {
      if (!creds.apiEndpoint) errors.apiEndpoint = t('shops.apiEndpointRequired')
      if (!creds.apiKey) errors.apiKey = t('shops.apiKeyRequired')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSaving(true)
    setError(null)

    try {
      const credentialsKey = `${formData.platform}Credentials`
      const payload = {
        name: formData.name,
        domain: formData.domain,
        platform: formData.platform,
        [credentialsKey]: formData.apiCredentials
      }

      const response = await api.post('/api/shops', payload)
      
      if (response.data._id || response.data.id) {
        setShops(prev => [...prev, response.data])
        setSuccess(t('shops.createSuccess'))
        setShowModal(false)
        setFormData(initialFormData)
        setFormErrors({})
        setTimeout(() => setSuccess(null), 3000)
      } else if (response.data.error || response.data.message) {
        setError(response.data.error || response.data.message)
      }
    } catch (err) {
      const error = err as { message?: string }
      setError(error.message || t('shops.failedCreate'))
    } finally {
      setSaving(false)
    }
  }

  const updateCredential = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      apiCredentials: { ...prev.apiCredentials, [field]: value }
    }))
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData(initialFormData)
    setFormErrors({})
  }

  const inputClass = (field: string) => `w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-gray-50 border-2 ${
    formErrors[field] ? 'border-red-500' : 'dark:border-slate-600 light:border-gray-300 focus:border-blue-500'
  } dark:text-white light:text-gray-900 placeholder:opacity-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`


  const renderCredentialFields = () => {
    switch (formData.platform) {
      case 'converty':
        return (
          <div className="space-y-3">
            <div>
              <input type="text" placeholder="API Key *" value={formData.apiCredentials.apiKey || ''} onChange={(e) => updateCredential('apiKey', e.target.value)} className={inputClass('apiKey')} />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
            <div>
              <input type="password" placeholder="API Secret *" value={formData.apiCredentials.apiSecret || ''} onChange={(e) => updateCredential('apiSecret', e.target.value)} className={inputClass('apiSecret')} />
              {formErrors.apiSecret && <p className="text-red-500 text-xs mt-1">{formErrors.apiSecret}</p>}
            </div>
            <div>
              <input type="url" placeholder="Store URL *" value={formData.apiCredentials.storeUrl || ''} onChange={(e) => updateCredential('storeUrl', e.target.value)} className={inputClass('storeUrl')} />
              {formErrors.storeUrl && <p className="text-red-500 text-xs mt-1">{formErrors.storeUrl}</p>}
            </div>
          </div>
        )
      case 'shopify':
        return (
          <div className="space-y-3">
            <div>
              <input type="text" placeholder="API Key *" value={formData.apiCredentials.apiKey || ''} onChange={(e) => updateCredential('apiKey', e.target.value)} className={inputClass('apiKey')} />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
            <div>
              <input type="password" placeholder="API Secret *" value={formData.apiCredentials.apiSecret || ''} onChange={(e) => updateCredential('apiSecret', e.target.value)} className={inputClass('apiSecret')} />
              {formErrors.apiSecret && <p className="text-red-500 text-xs mt-1">{formErrors.apiSecret}</p>}
            </div>
            <div>
              <input type="url" placeholder="Store URL *" value={formData.apiCredentials.storeUrl || ''} onChange={(e) => updateCredential('storeUrl', e.target.value)} className={inputClass('storeUrl')} />
              {formErrors.storeUrl && <p className="text-red-500 text-xs mt-1">{formErrors.storeUrl}</p>}
            </div>
          </div>
        )
      case 'woocommerce':
        return (
          <div className="space-y-3">
            <div>
              <input type="text" placeholder="Consumer Key *" value={formData.apiCredentials.consumerKey || ''} onChange={(e) => updateCredential('consumerKey', e.target.value)} className={inputClass('consumerKey')} />
              {formErrors.consumerKey && <p className="text-red-500 text-xs mt-1">{formErrors.consumerKey}</p>}
            </div>
            <div>
              <input type="password" placeholder="Consumer Secret *" value={formData.apiCredentials.consumerSecret || ''} onChange={(e) => updateCredential('consumerSecret', e.target.value)} className={inputClass('consumerSecret')} />
              {formErrors.consumerSecret && <p className="text-red-500 text-xs mt-1">{formErrors.consumerSecret}</p>}
            </div>
            <div>
              <input type="url" placeholder="Store URL *" value={formData.apiCredentials.storeUrl || ''} onChange={(e) => updateCredential('storeUrl', e.target.value)} className={inputClass('storeUrl')} />
              {formErrors.storeUrl && <p className="text-red-500 text-xs mt-1">{formErrors.storeUrl}</p>}
            </div>
          </div>
        )
      case 'meta':
        return (
          <div className="space-y-3">
            <div>
              <input type="text" placeholder="App ID *" value={formData.apiCredentials.appId || ''} onChange={(e) => updateCredential('appId', e.target.value)} className={inputClass('appId')} />
              {formErrors.appId && <p className="text-red-500 text-xs mt-1">{formErrors.appId}</p>}
            </div>
            <div>
              <input type="password" placeholder="App Secret *" value={formData.apiCredentials.appSecret || ''} onChange={(e) => updateCredential('appSecret', e.target.value)} className={inputClass('appSecret')} />
              {formErrors.appSecret && <p className="text-red-500 text-xs mt-1">{formErrors.appSecret}</p>}
            </div>
            <div>
              <input type="text" placeholder="Page ID *" value={formData.apiCredentials.pageId || ''} onChange={(e) => updateCredential('pageId', e.target.value)} className={inputClass('pageId')} />
              {formErrors.pageId && <p className="text-red-500 text-xs mt-1">{formErrors.pageId}</p>}
            </div>
          </div>
        )
      case 'tiktakpro':
        return (
          <div className="space-y-3">
            <div>
              <input type="text" placeholder="API Key *" value={formData.apiCredentials.apiKey || ''} onChange={(e) => updateCredential('apiKey', e.target.value)} className={inputClass('apiKey')} />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
            <div>
              <input type="password" placeholder="API Secret *" value={formData.apiCredentials.apiSecret || ''} onChange={(e) => updateCredential('apiSecret', e.target.value)} className={inputClass('apiSecret')} />
              {formErrors.apiSecret && <p className="text-red-500 text-xs mt-1">{formErrors.apiSecret}</p>}
            </div>
            <div>
              <input type="text" placeholder="Shop ID *" value={formData.apiCredentials.shopId || ''} onChange={(e) => updateCredential('shopId', e.target.value)} className={inputClass('shopId')} />
              {formErrors.shopId && <p className="text-red-500 text-xs mt-1">{formErrors.shopId}</p>}
            </div>
          </div>
        )
      case 'custom':
        return (
          <div className="space-y-3">
            <div>
              <input type="url" placeholder="API Endpoint *" value={formData.apiCredentials.apiEndpoint || ''} onChange={(e) => updateCredential('apiEndpoint', e.target.value)} className={inputClass('apiEndpoint')} />
              {formErrors.apiEndpoint && <p className="text-red-500 text-xs mt-1">{formErrors.apiEndpoint}</p>}
            </div>
            <div>
              <input type="text" placeholder="API Key *" value={formData.apiCredentials.apiKey || ''} onChange={(e) => updateCredential('apiKey', e.target.value)} className={inputClass('apiKey')} />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
          </div>
        )
      default:
        return null
    }
  }


  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('shops.title')}</h1>
              <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('shops.subtitle')}</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
              <PlusIcon className="w-5 h-5" />
              {t('shops.addNew')}
            </button>
          </div>

          {/* Alerts */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
              <CheckCircleIcon className="w-5 h-5" />
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              <ExclamationCircleIcon className="w-5 h-5" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><XMarkIcon className="w-4 h-4" /></button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="card p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="dark:text-slate-400 light:text-gray-600">{t('common.loadingShops')}</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="card p-12 text-center">
              <BuildingStorefrontIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('shops.noShops')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('shops.createFirst')}</p>
              <button onClick={() => setShowModal(true)} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                {t('shops.addNew')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => {
                const platform = platforms.find(p => p.id === shop.platform)
                const PlatformIcon = platform?.Icon || BuildingStorefrontIcon
                return (
                  <div key={shop._id} className="card p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                          <PlatformIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{shop.name}</h3>
                          <p className="text-sm dark:text-slate-400 light:text-gray-600">{shop.domain}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${shop.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {shop.isActive ? t('shops.active') : t('shops.inactive')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="dark:text-slate-400 light:text-gray-600">{platform?.name || shop.platform}</span>
                      {shop.subscriptionId && (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs capitalize">{shop.subscriptionId.plan}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}


          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 dark:bg-black/60 light:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="dark:bg-slate-900 light:bg-white rounded-xl shadow-2xl border dark:border-slate-700 light:border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 light:border-gray-200">
                  <h2 className="text-xl font-semibold dark:text-white light:text-gray-900">{t('shops.addNew')}</h2>
                  <button onClick={closeModal} className="p-2 rounded-lg dark:hover:bg-slate-800 light:hover:bg-gray-100 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Platform Selection */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 dark:text-white light:text-gray-900">{t('shops.platform')} *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {platforms.map((platform) => {
                        const Icon = platform.Icon
                        const isSelected = formData.platform === platform.id
                        return (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, platform: platform.id, apiCredentials: {} }))
                              setFormErrors(prev => ({ ...prev, platform: '' }))
                            }}
                            className={`p-5 rounded-lg border-2 transition-all flex flex-col items-center gap-3 ${
                              isSelected
                                ? 'border-blue-500 dark:bg-blue-500/20 light:bg-blue-50'
                                : 'dark:border-slate-600 light:border-gray-300 dark:bg-slate-800/50 light:bg-white dark:hover:border-slate-500 light:hover:border-gray-400'
                            }`}
                          >
                            <Icon className={`w-10 h-10 ${isSelected ? 'text-blue-500' : 'dark:text-slate-400 light:text-gray-500'}`} />
                            <span className={`text-sm font-medium text-center ${isSelected ? 'text-blue-500' : 'dark:text-slate-300 light:text-gray-800'}`}>{platform.name}</span>
                          </button>
                        )
                      })}
                    </div>
                    {formErrors.platform && <p className="text-red-500 text-xs mt-2">{formErrors.platform}</p>}
                  </div>

                  {formData.platform && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('shops.shopName')} *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => ({ ...prev, name: '' })) }}
                          className={inputClass('name')}
                          placeholder="My Store"
                        />
                        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('shops.domain')} *</label>
                        <input
                          type="text"
                          value={formData.domain}
                          onChange={(e) => { setFormData(prev => ({ ...prev, domain: e.target.value })); setFormErrors(prev => ({ ...prev, domain: '' })) }}
                          className={inputClass('domain')}
                          placeholder={formData.platform === 'converty' ? 'mystore.converty.com' : 'mystore.com'}
                        />
                        {formErrors.domain && <p className="text-red-500 text-xs mt-1">{formErrors.domain}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('shops.credentials')}</label>
                        {renderCredentialFields()}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 p-6 border-t dark:border-slate-700 light:border-gray-200">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 dark:bg-slate-800 light:bg-white dark:text-white light:text-gray-700 border-2 dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium">
                    {t('shops.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!formData.platform || saving}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        {t('shops.saving')}
                      </>
                    ) : t('shops.save')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
