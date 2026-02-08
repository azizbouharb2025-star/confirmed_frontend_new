'use client'

import { useState, useEffect } from 'react'
import { KeyIcon, DocumentDuplicateIcon, CheckIcon, ChevronDownIcon, BuildingStorefrontIcon, ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'
import api from '@/lib/api'
import logger from '@/lib/logger'

interface Shop {
  _id: string
  name: string
  domain: string
  platform: string
  apiCredentials?: {
    apiKey?: string
    apiSecret?: string
    webhookSecret?: string
  }
}

interface Credentials {
  apiKey: string
  apiSecret: string
  webhookSecret: string
  webhookUrl: string
  apiEndpoint: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function APIPage() {
  const { t } = useLanguage()
  const [selectedShop, setSelectedShop] = useState('')
  const [shops, setShops] = useState<Shop[]>([])
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState('')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})


  useEffect(() => {
    fetchShops()
  }, [])

  useEffect(() => {
    if (selectedShop) {
      loadCredentials()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop])

  const fetchShops = async () => {
    try {
      const response = await api.get('/api/shops')
      const shopList = Array.isArray(response.data) ? response.data : response.data?.shops || []
      setShops(shopList)
      if (shopList.length > 0) {
        setSelectedShop(shopList[0]._id)
      }
    } catch (err) {
      logger.error('Failed to fetch shops:', err, 'API')
    } finally {
      setLoading(false)
    }
  }

  const loadCredentials = () => {
    const shop = shops.find(s => s._id === selectedShop)
    if (shop?.apiCredentials?.apiKey) {
      setCredentials({
        apiKey: shop.apiCredentials.apiKey,
        apiSecret: shop.apiCredentials.apiSecret || '',
        webhookSecret: shop.apiCredentials.webhookSecret || '',
        webhookUrl: `${API_BASE}/external-api/webhooks/${selectedShop}`,
        apiEndpoint: `${API_BASE}/external-api`
      })
    } else {
      setCredentials(null)
    }
  }

  const generateCredentials = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await api.post(`/api/shops/${selectedShop}/generate-credentials`, {})
      
      if (response.data.apiKey || response.data.apiCredentials) {
        const creds = response.data.apiCredentials || response.data
        setCredentials({
          apiKey: creds.apiKey,
          apiSecret: creds.apiSecret || '',
          webhookSecret: creds.webhookSecret || '',
          webhookUrl: `${API_BASE}/external-api/webhooks/${selectedShop}`,
          apiEndpoint: `${API_BASE}/external-api`
        })
        // Update shop in local state
        setShops(prev => prev.map(s => 
          s._id === selectedShop ? { ...s, apiCredentials: creds } : s
        ))
        setSuccess('API credentials generated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else if (response.data.error) {
        setError(response.data.error)
      }
    } catch (err) {
      const error = err as { message?: string }
      setError(error.message || 'Failed to generate credentials')
    } finally {
      setGenerating(false)
    }
  }

  const revokeCredentials = async () => {
    if (!confirm('Are you sure you want to revoke these API credentials? This action cannot be undone.')) return
    
    setRevoking(true)
    setError(null)

    try {
      const response = await api.post(`/api/shops/${selectedShop}/revoke-credentials`, {})
      
      if (response.data.message || response.data.success) {
        setCredentials(null)
        setShops(prev => prev.map(s => 
          s._id === selectedShop ? { ...s, apiCredentials: undefined } : s
        ))
        setSuccess('API credentials revoked successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else if (response.data.error) {
        setError(response.data.error)
      }
    } catch (err) {
      const error = err as { message?: string }
      setError(error.message || 'Failed to revoke credentials')
    } finally {
      setRevoking(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const maskSecret = (secret: string) => {
    if (!secret) return ''
    return secret.substring(0, 8) + '••••••••••••••••' + secret.substring(secret.length - 4)
  }

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="flex items-center gap-2 px-3 py-1.5 text-sm dark:bg-slate-700 light:bg-gray-200 rounded-lg hover:opacity-80 transition-opacity"
    >
      {copiedField === field ? (
        <>
          <CheckIcon className="w-4 h-4 text-green-500" />
          {t('api.copied')}
        </>
      ) : (
        <>
          <DocumentDuplicateIcon className="w-4 h-4" />
          {t('api.copy')}
        </>
      )}
    </button>
  )


  // Loading state
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // No shops state
  if (shops.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="card p-12 text-center max-w-md">
              <BuildingStorefrontIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('products.noShopTitle')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('products.noShopDesc')}</p>
              <Link href="/panel/client/shops" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                {t('products.createShop')}
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('api.title')}</h1>
              <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('api.subtitle')}</p>
            </div>
            <div className="relative">
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-700 light:border-gray-300 dark:text-white light:text-gray-900 font-medium outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>{shop.name}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-slate-400 light:text-gray-500 pointer-events-none" />
            </div>
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


          {/* No Credentials State */}
          {!credentials ? (
            <div className="card p-12 text-center">
              <KeyIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('api.noCredentials')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('api.generateFirst')}</p>
              <button
                onClick={generateCredentials}
                disabled={generating}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {generating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-5 h-5" />
                    {t('api.generate')}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* API Key */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('api.apiKey')}</h3>
                  <CopyButton text={credentials.apiKey} field="apiKey" />
                </div>
                <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                  {credentials.apiKey}
                </code>
                <p className="text-xs dark:text-slate-500 light:text-gray-500 mt-2">
                  Use this key in the X-API-Key header for external API requests
                </p>
              </div>

              {/* API Secret */}
              {credentials.apiSecret && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{t('api.apiSecret')}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleShowSecret('apiSecret')}
                        className="p-2 dark:bg-slate-700 light:bg-gray-200 rounded-lg hover:opacity-80 transition-opacity"
                      >
                        {showSecrets.apiSecret ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                      <CopyButton text={credentials.apiSecret} field="apiSecret" />
                    </div>
                  </div>
                  <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                    {showSecrets.apiSecret ? credentials.apiSecret : maskSecret(credentials.apiSecret)}
                  </code>
                </div>
              )}

              {/* Webhook Secret */}
              {credentials.webhookSecret && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{t('api.webhookSecret')}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleShowSecret('webhookSecret')}
                        className="p-2 dark:bg-slate-700 light:bg-gray-200 rounded-lg hover:opacity-80 transition-opacity"
                      >
                        {showSecrets.webhookSecret ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                      <CopyButton text={credentials.webhookSecret} field="webhookSecret" />
                    </div>
                  </div>
                  <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                    {showSecrets.webhookSecret ? credentials.webhookSecret : maskSecret(credentials.webhookSecret)}
                  </code>
                </div>
              )}

              {/* Endpoints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{t('api.webhookUrl')}</h3>
                    <CopyButton text={credentials.webhookUrl} field="webhookUrl" />
                  </div>
                  <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                    {credentials.webhookUrl}
                  </code>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{t('api.apiEndpoint')}</h3>
                    <CopyButton text={credentials.apiEndpoint} field="apiEndpoint" />
                  </div>
                  <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                    {credentials.apiEndpoint}
                  </code>
                </div>
              </div>


              {/* Documentation */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">{t('api.documentation')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-xs font-medium">POST</span>
                      <span className="font-medium">Create Order</span>
                    </div>
                    <code className="text-xs break-all font-mono dark:text-slate-300 light:text-gray-700">
                      {credentials.apiEndpoint}/orders
                    </code>
                  </div>
                  <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded text-xs font-medium">GET</span>
                      <span className="font-medium">Get Order Status</span>
                    </div>
                    <code className="text-xs break-all font-mono dark:text-slate-300 light:text-gray-700">
                      {credentials.apiEndpoint}/orders/:orderId
                    </code>
                  </div>
                  <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-xs font-medium">POST</span>
                      <span className="font-medium">Add Product</span>
                    </div>
                    <code className="text-xs break-all font-mono dark:text-slate-300 light:text-gray-700">
                      {credentials.apiEndpoint}/products
                    </code>
                  </div>
                  <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-xs font-medium">POST</span>
                      <span className="font-medium">Sync Products</span>
                    </div>
                    <code className="text-xs break-all font-mono dark:text-slate-300 light:text-gray-700">
                      {credentials.apiEndpoint}/products/sync
                    </code>
                  </div>
                </div>

                {/* Example Request */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Example Request</h4>
                  <pre className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-xs overflow-x-auto">
{`curl -X POST ${credentials.apiEndpoint}/orders \\
  -H "X-API-Key: ${credentials.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderId": "EXT-001",
    "clientInfo": {
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "items": [{
      "name": "Product",
      "quantity": 1,
      "price": 99.99
    }],
    "totalAmount": 99.99
  }'`}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={generateCredentials}
                  disabled={generating}
                  className="flex-1 px-4 py-3 dark:bg-slate-800 light:bg-white border-2 dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  ) : (
                    <ArrowPathIcon className="w-5 h-5" />
                  )}
                  Regenerate Keys
                </button>
                <button
                  onClick={revokeCredentials}
                  disabled={revoking}
                  className="flex-1 px-4 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {revoking ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  ) : null}
                  {t('api.revoke')}
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
