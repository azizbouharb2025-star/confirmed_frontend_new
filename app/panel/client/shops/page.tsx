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
  convertyConnected?: boolean
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
  const [reconnectingShopId, setReconnectingShopId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<ShopFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})


  useEffect(() => {
    fetchShops()
  }, [])

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      )

    const convertyStatus =
      params.get('converty')

    if (convertyStatus === 'connected') {
      setSuccess(
        'Boutique Converty connectée avec succès.'
      )
    }

    if (
      convertyStatus ===
      'already-connected'
    ) {
      setError(
        'Cette boutique Converty est déjà connectée à une autre boutique Confirmed.'
      )
    }

    if (convertyStatus) {
      window.history.replaceState(
        {},
        '',
        window.location.pathname
      )
    }
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
    if (formData.platform === 'shopify') {
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
      const isConverty = formData.platform === 'converty'

      const payload: Record<string, unknown> = {
        name: formData.name,
        domain: formData.domain,
        platform: formData.platform
      }

      if (!isConverty) {
        const credentialsKey = `${formData.platform}Credentials`
        payload[credentialsKey] = formData.apiCredentials
      }

      const response = await api.post('/api/shops', payload)

      const createdShop = response.data?.shop || response.data

      if (!createdShop?._id && !createdShop?.id) {
        throw new Error(
          response.data?.error ||
          response.data?.message ||
          t('shops.failedCreate')
        )
      }

      if (isConverty) {
        const oauthResponse = await api.get(
          '/api/integration/converty/oauth/start'
        )

        const authorizationUrl =
          oauthResponse.data?.authorizationUrl

        if (!authorizationUrl) {
          throw new Error(
            'Impossible de démarrer la connexion Converty'
          )
        }

        window.location.assign(authorizationUrl)
        return
      }

      setShops(prev => [...prev, createdShop])
      setSuccess(t('shops.createSuccess'))
      setShowModal(false)
      setFormData(initialFormData)
      setFormErrors({})
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const error = err as {
        message?: string
        response?: {
          data?: {
            error?: string
            message?: string
          }
        }
      }

      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        t('shops.failedCreate')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleReconnectConverty = async (shopId: string) => {
    try {
      setReconnectingShopId(shopId)
      setError(null)

      const oauthResponse = await api.get(
        '/api/integration/converty/oauth/start'
      )

      const authorizationUrl =
        oauthResponse.data?.authorizationUrl

      if (!authorizationUrl) {
        throw new Error(
          'Impossible de démarrer la reconnexion Converty'
        )
      }

      window.location.assign(authorizationUrl)
    } catch (err) {
      const reconnectError = err as {
        message?: string
        response?: {
          data?: {
            error?: string
            message?: string
          }
        }
      }

      setError(
        reconnectError.response?.data?.error ||
        reconnectError.response?.data?.message ||
        reconnectError.message ||
        'Impossible de reconnecter Converty'
      )

      setReconnectingShopId(null)
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
          <div className="rounded-xl border-2 dark:border-slate-700 light:border-gray-200 p-4 dark:bg-slate-800/50 light:bg-blue-50/50">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold dark:text-white light:text-gray-900">
                  Connexion sécurisée avec Converty
                </p>
                <p className="text-sm mt-1 dark:text-slate-400 light:text-gray-600">
                  Aucun API Key ou API Secret n&apos;est nécessaire.
                  Confirmed vous redirigera vers Converty pour autoriser la connexion.
                </p>
              </div>
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
        <div className="relative isolate space-y-6">

          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] overflow-hidden rounded-[32px]"
            aria-hidden="true"
          >
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#ADFF2F]/10 blur-3xl" />
            <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-[#00BFFF]/10 blur-3xl" />
            <div className="absolute left-[38%] top-40 h-48 w-48 rounded-full bg-[#32CD32]/10 blur-3xl" />
          </div>

          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative pl-4">
              <span
                className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-gradient-to-b from-[#ADFF2F] via-[#32CD32] to-[#00BFFF]"
                aria-hidden="true"
              />

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {t('shops.title')}
              </h1>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t('shops.subtitle')}
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] px-4 py-2.5 font-semibold text-slate-950 shadow-lg shadow-green-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-green-500/20"
            >
              <PlusIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => {
                const platform = platforms.find(p => p.id === shop.platform)
                const PlatformIcon = platform?.Icon || BuildingStorefrontIcon
                return (
                  <div
                    key={shop._id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-sky-50/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#ADFF2F]/50 hover:shadow-xl dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20"
                  >
                    <div
                      className="pointer-events-none absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ADFF2F] to-transparent"
                      aria-hidden="true"
                    />

                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#00BFFF]/10 blur-3xl"
                      aria-hidden="true"
                    />
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ADFF2F]/25 bg-gradient-to-br from-[#ADFF2F]/15 to-[#00BFFF]/10 shadow-sm">
                          {shop.platform === 'converty' ? (
                            <img
                              src="/assets/converty.png"
                              alt="Converty"
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <PlatformIcon className="h-6 w-6 text-[#32CD32]" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold tracking-tight text-slate-950 dark:text-white">
                            {shop.name}
                          </h3>
                          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                            {shop.domain}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          shop.isActive
                            ? 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            shop.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        {shop.isActive ? t('shops.active') : t('shops.inactive')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        {platform?.name || shop.platform}
                      </span>
                      {shop.subscriptionId && (
                        <span className="rounded-lg border border-[#00BFFF]/20 bg-[#00BFFF]/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-sky-600 dark:text-sky-400">
                          {shop.subscriptionId.plan}
                        </span>
                      )}
                    </div>

                    {shop.platform === 'converty' && (
                      <div className="mt-5">
                        {shop.convertyConnected ? (
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>Converty connecté</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReconnectConverty(shop._id)}
                            disabled={reconnectingShopId === shop._id}
                            className="w-full rounded-xl border border-[#32CD32]/35 bg-gradient-to-r from-[#ADFF2F]/10 to-[#00BFFF]/5 px-4 py-2.5 text-sm font-semibold text-green-700 transition-all duration-300 hover:border-[#32CD32]/60 hover:bg-[#ADFF2F]/15 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400"
                          >
                            {reconnectingShopId === shop._id
                              ? 'Redirection vers Converty...'
                              : 'Connecter Converty'}
                          </button>
                        )}
                      </div>
                    )}
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
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            platform: 'converty',
                            apiCredentials: {}
                          }))
                          setFormErrors(prev => ({
                            ...prev,
                            platform: ''
                          }))
                        }}
                        className={`group flex w-full max-w-sm flex-col items-center justify-center gap-4 rounded-2xl border-2 px-6 py-8 transition-all ${
                          formData.platform === 'converty'
                            ? 'border-[#ADFF2F] bg-[#ADFF2F]/10 shadow-[0_0_0_1px_rgba(173,255,47,0.08),0_12px_35px_rgba(173,255,47,0.08)]'
                            : 'dark:border-slate-600 light:border-gray-300 dark:bg-slate-800/50 light:bg-white dark:hover:border-[#ADFF2F]/60 light:hover:border-[#ADFF2F]'
                        }`}
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
                          <img
                            src="/assets/converty.png"
                            alt="Converty"
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <div className="text-center">
                          <p
                            className={`text-base font-bold ${
                              formData.platform === 'converty'
                                ? 'text-[#ADFF2F]'
                                : 'dark:text-white light:text-gray-900'
                            }`}
                          >
                            Converty
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-500">
                            Connecter votre boutique via Converty
                          </p>
                        </div>
                      </button>
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
                        <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">
                          {formData.platform === 'converty'
                            ? 'Connexion'
                            : t('shops.credentials')}
                        </label>
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
                    ) : (
                      formData.platform === 'converty'
                        ? 'Créer et connecter Converty'
                        : t('shops.save')
                    )}
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
