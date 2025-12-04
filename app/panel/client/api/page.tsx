'use client'

import { useState } from 'react'
import { KeyIcon, DocumentDuplicateIcon, CheckIcon, ChevronDownIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'

export default function APIPage() {
  const { t } = useLanguage()
  const [selectedShop, setSelectedShop] = useState('')
  const [shops, setShops] = useState<any[]>([])
  const [credentials, setCredentials] = useState<any>(null)
  const [copiedField, setCopiedField] = useState('')

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  if (shops.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="card p-12 text-center max-w-md">
              <BuildingStorefrontIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('products.noShopTitle')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('products.noShopDesc')}</p>
              <Link
                href="/panel/client/shops"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
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
                <option value="">{t('products.selectShop')}</option>
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>{shop.name}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-slate-400 light:text-gray-500 pointer-events-none" />
            </div>
          </div>

          {!credentials ? (
            <div className="card p-12 text-center">
              <KeyIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('api.noCredentials')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('api.generateFirst')}</p>
              <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                {t('api.generate')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">{t('api.apiKey')}</h3>
                  <button
                    onClick={() => copyToClipboard(credentials.apiKey, 'apiKey')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm dark:bg-slate-800 light:bg-gray-100 rounded-lg hover:opacity-80 transition-opacity"
                  >
                    {copiedField === 'apiKey' ? (
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
                </div>
                <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                  {credentials.apiKey}
                </code>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">{t('api.apiSecret')}</h3>
                  <button
                    onClick={() => copyToClipboard(credentials.apiSecret, 'apiSecret')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm dark:bg-slate-800 light:bg-gray-100 rounded-lg hover:opacity-80 transition-opacity"
                  >
                    {copiedField === 'apiSecret' ? (
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
                </div>
                <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                  {credentials.apiSecret}
                </code>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">{t('api.webhookSecret')}</h3>
                  <button
                    onClick={() => copyToClipboard(credentials.webhookSecret, 'webhookSecret')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm dark:bg-slate-800 light:bg-gray-100 rounded-lg hover:opacity-80 transition-opacity"
                  >
                    {copiedField === 'webhookSecret' ? (
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
                </div>
                <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                  {credentials.webhookSecret}
                </code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('api.webhookUrl')}</h3>
                  <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                    {credentials.webhookUrl}
                  </code>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('api.apiEndpoint')}</h3>
                  <code className="block p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100 text-sm break-all font-mono">
                    {credentials.apiEndpoint}
                  </code>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">{t('api.documentation')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100">
                    <p className="font-medium mb-2">GET Orders</p>
                    <code className="text-xs break-all font-mono dark:text-slate-300 light:text-gray-700">
                      {credentials.documentation?.endpoints?.orders}
                    </code>
                  </div>
                  <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100">
                    <p className="font-medium mb-2">GET Products</p>
                    <code className="text-xs break-all font-mono dark:text-slate-300 light:text-gray-700">
                      {credentials.documentation?.endpoints?.products}
                    </code>
                  </div>
                  <div className="p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100">
                    <p className="font-medium mb-2">POST Webhooks</p>
                    <code className="text-xs break-all font-mono dark:text-slate-300 light:text-gray-700">
                      {credentials.documentation?.endpoints?.webhooks}
                    </code>
                  </div>
                </div>
              </div>

              <button className="w-full px-4 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium">
                {t('api.revoke')}
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
