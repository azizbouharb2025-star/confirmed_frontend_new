'use client'

import { useState } from 'react'
import { BuildingStorefrontIcon, PlusIcon, ShoppingBagIcon, DevicePhoneMobileIcon, ShoppingCartIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'

const platforms = [
  { id: 'converty', name: 'Converty', Icon: ShoppingBagIcon },
  { id: 'meta', name: 'Meta (Facebook/Instagram)', Icon: DevicePhoneMobileIcon },
  { id: 'tiktakpro', name: 'TikTakPro', Icon: ShoppingCartIcon },
  { id: 'custom', name: 'Custom Website', Icon: GlobeAltIcon }
]

export default function ShopsPage() {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [shops, setShops] = useState<any[]>([])

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('shops.title')}</h1>
              <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('shops.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              {t('shops.addNew')}
            </button>
          </div>

          {shops.length === 0 ? (
            <div className="card p-12 text-center">
              <BuildingStorefrontIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('shops.noShops')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('shops.createFirst')}</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('shops.addNew')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shop) => {
                const PlatformIcon = platforms.find(p => p.id === shop.platform)?.Icon
                return (
                  <div key={shop.id} className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        {PlatformIcon && <PlatformIcon className="w-6 h-6 text-blue-500" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{shop.name}</h3>
                        <p className="text-sm dark:text-slate-400 light:text-gray-600">{shop.domain}</p>
                      </div>
                    </div>
                    <div className="text-sm dark:text-slate-400 light:text-gray-600">
                      {platforms.find(p => p.id === shop.platform)?.name}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 dark:bg-black/60 light:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="dark:bg-slate-900 light:bg-white rounded-xl shadow-2xl border dark:border-slate-700 light:border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b dark:border-slate-700 light:border-gray-200">
                  <h2 className="text-xl font-semibold dark:text-white light:text-gray-900">{t('shops.addNew')}</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 dark:text-white light:text-gray-900">{t('shops.platform')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {platforms.map((platform) => {
                          const Icon = platform.Icon
                          const isSelected = selectedPlatform === platform.id
                          return (
                            <button
                              key={platform.id}
                              onClick={() => setSelectedPlatform(platform.id)}
                              className={`p-5 rounded-lg border-2 transition-all flex flex-col items-center gap-3 ${
                                isSelected
                                  ? 'border-blue-500 dark:bg-blue-500/20 light:bg-blue-50'
                                  : 'dark:border-slate-600 light:border-gray-300 dark:bg-slate-800/50 light:bg-white dark:hover:border-blue-400 light:hover:border-blue-300 light:hover:bg-gray-50'
                              }`}
                            >
                              <Icon className={`w-10 h-10 ${isSelected ? 'text-blue-500' : 'dark:text-slate-400 light:text-gray-500'}`} />
                              <div className={`text-sm font-medium text-center ${isSelected ? 'text-blue-600' : 'dark:text-slate-300 light:text-gray-800'}`}>{platform.name}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {selectedPlatform && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('shops.shopName')}</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder="My Store"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('shops.domain')}</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            placeholder={selectedPlatform === 'converty' ? 'mystore.converty.com' : 'mystore.com'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('shops.credentials')}</label>
                          {selectedPlatform === 'converty' && (
                            <div className="space-y-3">
                              <input type="text" placeholder="API Key" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="API Secret" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="Access Token" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                            </div>
                          )}
                          {selectedPlatform === 'meta' && (
                            <div className="space-y-3">
                              <input type="text" placeholder="App ID" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="App Secret" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="Page ID" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="Access Token" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                            </div>
                          )}
                          {selectedPlatform === 'tiktakpro' && (
                            <div className="space-y-3">
                              <input type="text" placeholder="Consumer Key" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="Consumer Secret" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="Store URL" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                            </div>
                          )}
                          {selectedPlatform === 'custom' && (
                            <div className="space-y-3">
                              <input type="text" placeholder="API Endpoint" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                              <input type="text" placeholder="API Key" className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-6 border-t dark:border-slate-700 light:border-gray-200">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 dark:bg-slate-800 light:bg-white dark:text-white light:text-gray-700 border-2 dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium"
                    >
                      {t('shops.cancel')}
                    </button>
                    <button
                      disabled={!selectedPlatform}
                      className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {t('shops.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
